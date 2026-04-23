// controllers/communityController.js

const CommunityPost = require('../models/CommunityPost');

const respond = (res, code, data, msg = 'Success') =>
  res.status(code).json({ success: true, message: msg, data });

// =============================================================================
//  GET /api/community  (protected)
//  Query: forum, limit, page
// =============================================================================
exports.getPosts = async (req, res) => {
  try {
    const { forum, limit = 15, page = 1 } = req.query;

    const filter = { isActive: true };
    if (forum) filter.forum = forum;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await CommunityPost.countDocuments(filter);
    const posts = await CommunityPost
      .find(filter)
      .populate('author', 'fullName username college avatarUrl')
      .sort({ visibility: -1, createdAt: -1 }) // pinned first
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      message: 'Success',
      data: posts,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================================================
//  POST /api/community  (protected)
// =============================================================================
exports.createPost = async (req, res) => {
  try {
    const { content, forum } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Post content is required.' });
    }

    const post = await CommunityPost.create({
      author: req.user.id,
      content: content.trim(),
      forum: forum || 'General',
    });

    const populated = await post.populate('author', 'fullName username college avatarUrl');
    respond(res, 201, populated, 'Post created.');
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// =============================================================================
//  POST /api/community/:id/like  (protected)
// =============================================================================
exports.likePost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const userId   = req.user.id.toString();
    const alreadyLiked = post.likedBy.map(id => id.toString()).includes(userId);

    if (alreadyLiked) {
      // Unlike
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId);
      post.likes   = Math.max(0, post.likes - 1);
    } else {
      post.likedBy.push(req.user.id);
      post.likes += 1;
    }

    await post.save();
    respond(res, 200, { likes: post.likes, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================================================
//  POST /api/community/:id/comment  (protected)
// =============================================================================
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required.' });
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    post.comments.push({ author: req.user.id, content: content.trim() });
    await post.save();

    respond(res, 201, post.comments[post.comments.length - 1], 'Comment added.');
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// =============================================================================
//  DELETE /api/community/:id  (protected — own post or admin)
// =============================================================================
exports.deletePost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const isOwner = post.author.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    post.isActive = false;
    await post.save();
    respond(res, 200, {}, 'Post deleted.');
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};