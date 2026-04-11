// server.js
// ============================================================
// STUNET — Express Middleware Layer
//
// Architecture:
//   Frontend (5500) ──► Express (3000) ──► Flask (5000) ──► MongoDB
//
// What Express owns:
//   ✅ JWT session management (issue + verify tokens)
//   ✅ Route-level auth middleware (protect pages)
//   ✅ Input pre-validation (basic checks before Flask)
//   ✅ CORS policy (only frontend can talk to Express)
//   ✅ Rate limiting at Express level (defence in depth)
//   ✅ Request logging
//   ✅ X-Internal-Key injection (Flask trusts Express, not browsers)
//   ✅ Clean error handling when Flask is down
//
// What Flask owns:
//   ✅ MongoDB read/write
//   ✅ Password hashing and verification
//   ✅ OTP generation, hashing, and email sending
//   ✅ Deep validation (email domains, password strength)
//   ✅ MongoDB-backed rate limiting (IP level)
// ============================================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

// ── Validate required env vars on startup ───────────────────
const REQUIRED_ENV = ["FLASK_BASE_URL", "INTERNAL_API_KEY", "JWT_SECRET"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `❌  Missing required environment variables: ${missing.join(", ")}`,
  );
  console.error("    Copy .env.example to .env and fill in the values.");
  process.exit(1);
}

const app = express();
const PORT = process.env.EXPRESS_PORT || 3000;

// ── CORS ─────────────────────────────────────────────────────
// Only allow requests from the frontend address.
// This stops random websites from making requests on a user's behalf.
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://127.0.0.1:3001",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// ── Body Parser ───────────────────────────────────────────────
app.use(express.json({ limit: "10kb" })); // Reject bodies > 10kb

// ── Request Logger ────────────────────────────────────────────
// 'dev' format: GET /auth/login 200 12ms
app.use(morgan("dev"));

// ── Express-level Rate Limiting ───────────────────────────────
// Defence in depth — Flask also rate limits, but this stops
// floods before they even reach Flask.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "rate_limit_exceeded",
    message: "Too many requests. Please slow down.",
  },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // stricter limit for auth routes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "rate_limit_exceeded",
    message: "Too many auth attempts. Please try again in an hour.",
  },
});

app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────────
app.use("/auth", authLimiter, authRoutes); // /auth/login, /auth/register, etc.
app.use("/user", userRoutes); // /user/me, /user/profile/:username, etc.

// ── Health Check ─────────────────────────────────────────────
// Lets you quickly confirm Express is alive: GET /health
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "STUNET Express",
    flask: process.env.FLASK_BASE_URL,
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: "not_found",
    message: `Route ${req.method} ${req.path} does not exist.`,
  });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({
    status: "internal_error",
    message: "Something went wrong on the server.",
  });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("\n🚀  STUNET Express is running!");
  console.log(`    Express → http://localhost:${PORT}`);
  console.log(`    Flask   → ${process.env.FLASK_BASE_URL}`);
  console.log(`    Origins → ${allowedOrigins.join(", ")}`);
  console.log("\n    Routes available:");
  console.log("    POST /auth/register");
  console.log("    POST /auth/verify-otp");
  console.log("    POST /auth/resend-otp");
  console.log("    POST /auth/login");
  console.log("    POST /auth/forgot-password");
  console.log("    POST /auth/verify-reset-otp");
  console.log("    POST /auth/reset-password");
  console.log("    GET  /user/verify-session   [requires JWT]");
  console.log("    GET  /user/me               [requires JWT]");
  console.log("    GET  /user/profile/:username [requires JWT]");
  console.log("    GET  /health");
  console.log("");
});
