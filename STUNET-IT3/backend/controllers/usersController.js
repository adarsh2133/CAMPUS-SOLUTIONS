// controllers/usersController.js
// Used by Find Teammates page to browse other student profiles

const User = require('../models/user');

const respond = (res, code, data, msg = 'Success') =>
  res.status(code).json({ success: true, message: msg, data });

// =============================================================================
//  GET /api/users  (protected)
//  Query: skill, college, year, search, limit, page
// =============================================================================
exports.getUsers = async (req, res) => {
  try {
    const { skill, college, year, search, limit = 20, page = 1 } = req.query;

    const filter = {
      isVerified: true,
      isActive:   true,
      _id:        { $ne: req.user.id }, // exclude self
    };

    if (skill)    filter.skills  = { $in: [new RegExp(skill, 'i')] };
    if (college)  filter.college = new RegExp(college, 'i');
    if (year)     filter.year    = year;

    if (search) {
      filter.$or = [
        { fullName: new RegExp(search, 'i') },
        { username: new RegExp(search, 'i') },
        { role:     new RegExp(search, 'i') },
        { skills:   { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);
    const users = await User
      .find(filter)
      .select('fullName username role bio college year location skills avatarUrl stats createdAt')
      .sort({ 'stats.rating': -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      message: 'Success',
      data: users,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================================================
//  GET /api/users/:username  (protected)
// =============================================================================
exports.getUserByUsername = async (req, res) => {
  try {
    const user = await User
      .findOne({ username: req.params.username.toLowerCase() })
      .select('-password -otp -resetPasswordToken -resetPasswordExpires');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    respond(res, 200, user);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================================================
//  GET /api/users/leaderboard  (public)
// =============================================================================
exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User
      .find({ isVerified: true, isActive: true })
      .select('fullName username college avatarUrl stats.points stats.hackathons stats.rating')
      .sort({ 'stats.points': -1 })
      .limit(20);

    respond(res, 200, users);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};