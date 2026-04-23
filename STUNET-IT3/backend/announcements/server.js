// server.js — STUNET Express API Entry Point  ✅ FIXED
//
// FIXES:
//  [BUG 5] CORS: now accepts all localhost ports (5500, 3000, 8080 etc.) + null origin for file://
//  [BUG 8] Removed xss-clean (broken in Node 18+) — replaced with manual sanitiser

require('dotenv').config();

const express       = require('express');
const path          = require('path');
const morgan        = require('morgan');
const cors          = require('cors');
const helmet        = require('helmet');
const rateLimit     = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes          = require('./routes/auth');
const competitionsRoutes  = require('./routes/competitions');
const communityRoutes     = require('./routes/community');
const usersRoutes         = require('./routes/users');
const announcementsRoutes = require('./routes/announcements');

connectDB();

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── CORS — FIX [BUG 5] ───────────────────────────────────────────────────────
// Accept: any localhost port, 127.0.0.1 port, configured CLIENT_URL,
// AND null (which browsers send for file:// origins)
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow Postman / curl (no origin header)
    if (!origin) return callback(null, true);
    // Allow null origin = file:// protocol in browser
    if (origin === 'null') return callback(null, true);
    // Allow any localhost / 127.0.0.1 regardless of port
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    // Allow explicitly configured origins
    if (configuredOrigins.includes(origin)) return callback(null, true);
    // Block everything else
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Rate limiting ──────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── MongoDB operator sanitisation ─────────────────────────────────────────────
app.use(mongoSanitize());

// FIX [BUG 8]: xss-clean is broken in Node 18+ — replaced with a simple inline sanitiser
// This strips < > from string fields in req.body to prevent XSS
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitise = (obj) => {
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].replace(/</g, '&lt;').replace(/>/g, '&gt;');
        } else if (obj[key] && typeof obj[key] === 'object') {
          sanitise(obj[key]);
        }
      }
    };
    sanitise(req.body);
  }
  next();
});

// ── Dev logging ───────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Static files (avatar uploads) ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'STUNET API is running', env: process.env.NODE_ENV, time: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/competitions',  competitionsRoutes);
app.use('/api/community',     communityRoutes);
app.use('/api/users',         usersRoutes);
app.use('/api/announcements', announcementsRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT   = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 STUNET API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.message);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => server.close(() => console.log('Server closed.')));

module.exports = app;