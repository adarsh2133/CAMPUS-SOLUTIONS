const express = require('express');
const router = express.Router();

const {
  getCompetitions,
  getStats,
  getCompetition,
  createCompetition,
  updateCompetition,
} = require('../controllers/competitionsController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/stats', getStats);
router.get('/', getCompetitions);
router.get('/:id', getCompetition);
router.post('/', protect, adminOnly, createCompetition);
router.put('/:id', protect, adminOnly, updateCompetition);

module.exports = router;
