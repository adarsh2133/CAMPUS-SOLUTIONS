// models/Competition.js

const mongoose = require('mongoose');

const CompetitionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Competition name is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ['Hackathon', 'Design', 'AI', 'Business', 'Coding', 'Open', 'Web3', 'Pitch'],
      default: 'Open',
    },
    status: {
      type: String,
      enum: ['active', 'upcoming', 'ended'],
      default: 'upcoming',
    },
    prizePool: {
      type: String, // e.g. "₹2,00,000" — stored as string for flexibility
      default: '',
    },
    registrationDeadline: {
      type: Date,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    officialUrl: {
      type: String,
      default: '',
    },
    organiser: {
      type: String,
      default: '',
    },
    teamSizeMin: { type: Number, default: 1 },
    teamSizeMax: { type: Number, default: 4 },
    tags: {
      type: [String],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    registeredTeams: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

CompetitionSchema.index({ status: 1 });
CompetitionSchema.index({ category: 1 });
CompetitionSchema.index({ registrationDeadline: 1 });

module.exports = mongoose.model('Competition', CompetitionSchema);