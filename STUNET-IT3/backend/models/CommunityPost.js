// models/CommunityPost.js

const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true }
);

const CommunityPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      maxlength: [2000, 'Post cannot exceed 2000 characters'],
    },
    forum: {
      type: String,
      enum: ['General', 'AI/ML', 'Team Formation', 'Resources', 'Web3', 'Jobs'],
      default: 'General',
    },
    visibility: {
      type: String,
      enum: ['public', 'pinned'],
      default: 'public',
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    comments: [CommentSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

CommunityPostSchema.index({ createdAt: -1 });
CommunityPostSchema.index({ forum: 1 });
CommunityPostSchema.index({ author: 1 });

module.exports = mongoose.model('CommunityPost', CommunityPostSchema);