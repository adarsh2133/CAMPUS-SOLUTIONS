// controllers/announcementsController.js

const Announcement = require('../models/Announcement');

const respond = (res, code, data, msg = 'Success') =>
  res.status(code).json({ success: true, message: msg, data });

// GET /api/announcements  (public)
exports.getAnnouncements = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const now = new Date();

    const anns = await Announcement
      .find({
        isActive: true,
        $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }],
      })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(Number(limit));

    respond(res, 200, anns);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/announcements  (admin only)
exports.createAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.create({ ...req.body, createdBy: req.user.id });
    respond(res, 201, ann, 'Announcement created.');
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/announcements/:id  (admin only)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!ann) return res.status(404).json({ success: false, message: 'Not found.' });
    respond(res, 200, {}, 'Announcement removed.');
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};