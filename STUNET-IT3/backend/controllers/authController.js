// controllers/authController.js  ✅ FIXED
//
// FIXES:
//  [BUG 4]: signup now generates a username if none is provided
//  [BUG 3]: updateProfile maps free-text year input → enum value

const User      = require('../models/user');
const sendEmail = require('../utils/sendEmail');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const respond     = (res, code, data, msg = 'Success') => res.status(code).json({ success: true, message: msg, data });
const fail        = (res, code, msg) => res.status(code).json({ success: false, message: msg });

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    let { fullName, username, email, password, college, year, skills } = req.body;

    // FIX [BUG 4]: auto-generate username if frontend didn't send one
    if (!username || username.trim() === '') {
      const base = (fullName || 'user').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      username = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
    }
    username = username.toLowerCase().trim();

    const existingEmail    = await User.findOne({ email: email.toLowerCase() });
    const existingUsername = await User.findOne({ username });

    if (existingEmail)    return fail(res, 409, 'An account with this email already exists.');
    if (existingUsername) {
      // If username collision from auto-gen, append more randomness and retry
      username = `${username}_${Math.floor(100 + Math.random() * 900)}`;
    }

    let skillsArray = [];
    if (skills) {
      skillsArray = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    const user = await User.create({
      fullName,
      username,
      email,
      password,
      college: college || '',
      year:    '',           // set blank; user fills in settings after signup
      skills:  skillsArray,
      isVerified: false,
    });

    const otp = generateOTP();
    user.otp  = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        to:      user.email,
        subject: 'STUNET — Verify your email',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
            <h2 style="color:#3debbc;">Welcome to STUNET, ${user.fullName.split(' ')[0]}!</h2>
            <p>Your verification code is:</p>
            <div style="font-size:40px;font-weight:800;letter-spacing:10px;color:#111;background:#f4f4f4;padding:20px;border-radius:8px;text-align:center;">
              ${otp}
            </div>
            <p style="color:#666;font-size:13px;">This code expires in <b>10 minutes</b>.</p>
          </div>`,
      });
    } catch (emailErr) {
      console.error('OTP email failed (non-fatal):', emailErr.message);
    }

    respond(res, 201, { email: user.email }, 'Account created. Check your email for the OTP.');
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp.code +otp.expiresAt');

    if (!user)                              return fail(res, 404, 'No account found with this email.');
    if (!user.otp?.code)                    return fail(res, 400, 'No OTP found. Please request a new one.');
    if (user.otp.code !== otp)              return fail(res, 400, 'Invalid OTP. Please try again.');
    if (user.otp.expiresAt < Date.now())    return fail(res, 400, 'OTP has expired. Please request a new one.');

    user.isVerified = true;
    user.otp        = undefined;
    await user.save({ validateBeforeSave: false });

    const token = user.getSignedJwtToken();
    respond(res, 200, { token, user: user.toPublicJSON() }, 'Email verified successfully.');
  } catch (err) {
    console.error('OTP verify error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/resend-otp ─────────────────────────────────────────────────
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp.expiresAt');

    if (!user)           return fail(res, 404, 'No account found with this email.');
    if (user.isVerified) return fail(res, 400, 'This account is already verified.');

    if (user.otp?.expiresAt && user.otp.expiresAt - Date.now() > 9 * 60 * 1000) {
      return fail(res, 429, 'Please wait before requesting a new OTP.');
    }

    const otp = generateOTP();
    user.otp  = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      to:      user.email,
      subject: 'STUNET — New OTP',
      html: `<p>Your new OTP is: <b style="font-size:24px;letter-spacing:4px;">${otp}</b></p><p>Expires in 10 minutes.</p>`,
    });

    respond(res, 200, {}, 'A new OTP has been sent to your email.');
  } catch (err) {
    console.error('Resend OTP error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 400, 'Please provide email and password.');

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user)           return fail(res, 401, 'Invalid email or password.');
    if (!user.isActive)  return fail(res, 403, 'This account has been deactivated.');

    const isMatch = await user.matchPassword(password);
    if (!isMatch)        return fail(res, 401, 'Invalid email or password.');
    if (!user.isVerified) return fail(res, 403, 'Please verify your email before logging in.');

    const token = user.getSignedJwtToken();
    respond(res, 200, { token, user: user.toPublicJSON() }, 'Login successful.');
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return fail(res, 404, 'User not found.');
    respond(res, 200, user.toPublicJSON());
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
exports.logout = async (_req, res) => {
  respond(res, 200, {}, 'Logged out successfully.');
};

// ── PUT /api/auth/update-profile ──────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['fullName', 'role', 'bio', 'college', 'year', 'location', 'skills', 'socialLinks'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    // Parse skills string
    if (typeof updates.skills === 'string') {
      updates.skills = updates.skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    // FIX [BUG 3]: map free-text / numeric year to enum values
    if (updates.year !== undefined) {
      const yearMap = {
        '1': '1st Year', '1st': '1st Year', 'first': '1st Year',
        '2': '2nd Year', '2nd': '2nd Year', 'second': '2nd Year',
        '3': '3rd Year', '3rd': '3rd Year', 'third': '3rd Year',
        '4': '4th Year', '4th': '4th Year', 'fourth': '4th Year',
        'pg': 'Postgrad', 'postgrad': 'Postgrad', 'postgraduate': 'Postgrad',
        'alumni': 'Alumni',
      };
      const validEnum = ['1st Year','2nd Year','3rd Year','4th Year','Postgrad','Alumni',''];
      const raw       = String(updates.year).trim().toLowerCase();
      updates.year    = yearMap[raw] ?? (validEnum.includes(updates.year) ? updates.year : '');
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    respond(res, 200, user.toPublicJSON(), 'Profile updated successfully.');
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/auth/change-password ─────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!user)                                 return fail(res, 404, 'User not found.');
    if (!await user.matchPassword(currentPassword)) return fail(res, 401, 'Current password is incorrect.');

    user.password = newPassword;
    await user.save();
    respond(res, 200, {}, 'Password changed successfully.');
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};