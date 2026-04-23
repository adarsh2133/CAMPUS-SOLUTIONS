// models/Announcement.js — Platform-wide announcements shown on the dashboard

const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: 150,
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'competition'],
      default: 'info',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ createdAt: -1 });
AnnouncementSchema.index({ isActive: 1, pinned: -1 });

module.exports = mongoose.model('Announcement', AnnouncementSchema);