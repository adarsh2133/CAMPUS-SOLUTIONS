// routes/users.js

const express = require('express');
const router  = express.Router();

const {
  getUsers, getUserByUsername, getLeaderboard,
} = require('../controllers/usersController');

const { protect } = require('../middleware/auth');

router.get('/leaderboard',  getLeaderboard);
router.get('/',             protect, getUsers);
router.get('/:username',    protect, getUserByUsername);

module.exports = router;