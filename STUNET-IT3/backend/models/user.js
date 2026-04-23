// models/User.js — STUNET user schema

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [80, 'Full name cannot exceed 80 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned in queries by default
    },

    // ── Profile Info ──────────────────────────────────────
    role: {
      type: String,
      default: 'Student Developer',
      maxlength: 60,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '', // empty means use initials on frontend
    },
    college: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    year: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgrad', 'Alumni', ''],
      default: '',
    },
    location: {
      type: String,
      trim: true,
      maxlength: 80,
    },

    // ── Skills & Social ───────────────────────────────────
    skills: {
      type: [String],
      default: [],
    },
    socialLinks: {
      github:    { type: String, default: '' },
      linkedin:  { type: String, default: '' },
      twitter:   { type: String, default: '' },
      portfolio: { type: String, default: '' },
    },

    // ── Stats (denormalised for quick display) ────────────
    stats: {
      rating:     { type: Number, default: 0, min: 0, max: 5 },
      projects:   { type: Number, default: 0 },
      hackathons: { type: Number, default: 0 },
      points:     { type: Number, default: 0 },
    },

    // ── Account Status ────────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role_type: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    // ── OTP ───────────────────────────────────────────────
    otp: {
      code:      { type: String, select: false },
      expiresAt: { type: Date,   select: false },
    },

    // ── Password Reset ────────────────────────────────────
    resetPasswordToken:   { type: String, select: false },
    resetPasswordExpires: { type: Date,   select: false },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Index ─────────────────────────────────────────────────
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ college: 1 });
UserSchema.index({ skills: 1 });

// ── Hash password before save ─────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Compare password ──────────────────────────────────────
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ── Sign JWT ──────────────────────────────────────────────
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role_type },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ── Public profile (strip sensitive fields) ───────────────
UserSchema.methods.toPublicJSON = function () {
  return {
    _id:         this._id,
    fullName:    this.fullName,
    username:    this.username,
    email:       this.email,
    role:        this.role,
    bio:         this.bio,
    avatarUrl:   this.avatarUrl,
    college:     this.college,
    year:        this.year,
    location:    this.location,
    skills:      this.skills,
    socialLinks: this.socialLinks,
    stats:       this.stats,
    isVerified:  this.isVerified,
    createdAt:   this.createdAt,
  };
};

module.exports = mongoose.model('User', UserSchema);