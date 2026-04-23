// controllers/competitionsController.js

const Competition = require('../models/Competition');

const respond = (res, code, data, msg = 'Success') =>
  res.status(code).json({ success: true, message: msg, data });

// =============================================================================
//  GET /api/competitions  (public)
//  Query params: status, category, limit, page
// =============================================================================
exports.getCompetitions = async (req, res) => {
  try {
    const { status, category, limit = 20, page = 1 } = req.query;

    const filter = {};
    if (status)   filter.status   = status;
    if (category) filter.category = category;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Competition.countDocuments(filter);
    const comps = await Competition
      .find(filter)
      .sort({ isFeatured: -1, registrationDeadline: 1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      message: 'Success',
      data: comps,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================================================
//  GET /api/competitions/stats  (public)
// =============================================================================
exports.getStats = async (req, res) => {
  try {
    const [active, total, upcoming] = await Promise.all([
      Competition.countDocuments({ status: 'active' }),
      Competition.countDocuments(),
      Competition.countDocuments({ status: 'upcoming' }),
    ]);
    respond(res, 200, { active, total, upcoming });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================================================
//  GET /api/competitions/:id  (public)
// =============================================================================
exports.getCompetition = async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ success: false, message: 'Competition not found.' });
    respond(res, 200, comp);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================================================
//  POST /api/competitions  (admin only)
// =============================================================================
exports.createCompetition = async (req, res) => {
  try {
    const comp = await Competition.create(req.body);
    respond(res, 201, comp, 'Competition created.');
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// =============================================================================
//  PUT /api/competitions/:id  (admin only)
// =============================================================================
exports.updateCompetition = async (req, res) => {
  try {
    const comp = await Competition.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!comp) return res.status(404).json({ success: false, message: 'Competition not found.' });
    respond(res, 200, comp, 'Competition updated.');
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};