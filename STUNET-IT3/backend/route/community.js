const express = require('express');
const router = express.Router();

const {
  getPosts,
  createPost,
  likePost,
  addComment,
  deletePost,
} = require('../controllers/communityController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getPosts);
router.post('/', protect, createPost);
router.post('/:id/like', protect, likePost);
router.post('/:id/comment', protect, addComment);
router.delete('/:id', protect, deletePost);

module.exports = router;
