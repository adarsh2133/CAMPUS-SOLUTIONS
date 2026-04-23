// middleware/auth.js — JWT verification middleware

const jwt  = require('jsonwebtoken');
const User = require('../models/user');

// ── protect ───────────────────────────────────────────────────────────────────
// Attaches req.user for downstream controllers.
// Expects:  Authorization: Bearer <token>
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorised. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach minimal user payload (id + role)
    const user = await User.findById(decoded.id).select('_id role_type isActive isVerified');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Token user no longer exists.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    req.user = { id: user._id.toString(), role: user.role_type };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

// ── adminOnly ─────────────────────────────────────────────────────────────────
exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};