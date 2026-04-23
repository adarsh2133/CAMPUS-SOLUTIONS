// routes/auth.js  ✅ FIXED
//
// FIX [BUG 4]: username validator changed from .notEmpty() to .optional()
//   because stunet-signup.html has no username field — the frontend
//   auto-generates one, but if it somehow arrives empty we still accept it
//   and the controller will handle a fallback.

const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');

const {
  signup, verifyOtp, resendOtp,
  login, getMe, logout,
  updateProfile, changePassword,
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');
const upload      = require('../middleware/upload');

// ── Validators ────────────────────────────────────────────────────────────────

const signupRules = [
  body('fullName')
    .trim().notEmpty().withMessage('Full name is required.')
    .isLength({ max: 80 }),

  // FIX [BUG 4]: username is optional — frontend auto-generates it
  body('username')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters.')
    .matches(/^[a-z0-9_]+$/i).withMessage('Username can only contain letters, numbers, and underscores.'),

  body('email')
    .trim().isEmail().withMessage('Please provide a valid email.')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const otpRules = [
  body('email').trim().isEmail().withMessage('Valid email required.').normalizeEmail(),
  body('otp')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.')
    .isNumeric().withMessage('OTP must be numeric.'),
];

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/signup',     signupRules, validate, signup);
router.post('/login',      loginRules,  validate, login);
router.post('/verify-otp', otpRules,    validate, verifyOtp);
router.post('/resend-otp',
  [body('email').trim().isEmail().normalizeEmail()],
  validate, resendOtp
);

// ── Protected ─────────────────────────────────────────────────────────────────
router.get ('/me',              protect, getMe);
router.post('/logout',          protect, logout);
router.put ('/update-profile',  protect, updateProfile);
router.put ('/change-password', protect, changePassword);

// Avatar upload
router.post('/upload-avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const User      = require('../models/user');
    const avatarUrl = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user.id, { avatarUrl });
    res.status(200).json({ success: true, message: 'Avatar uploaded.', data: { avatarUrl } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;