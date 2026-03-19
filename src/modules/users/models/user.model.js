const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../../config/environment');
const { USER_ROLES, REGEX } = require('../../../config/constants');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [REGEX?.EMAIL || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.CUSTOMER
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^[0-9+\-\s()]{10,15}$/, 'Please provide a valid phone number']
  },
  profilePicture: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Soft delete fields
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Account lock for security
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  
  // User preferences
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'sw', 'fr']
    },
    currency: {
      type: String,
      default: 'KES',
      enum: ['KES', 'USD', 'EUR']
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark', 'system']
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      delete ret.passwordResetToken;
      delete ret.emailVerificationToken;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// ==================== INDEXES ====================
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ deletedAt: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'preferences.language': 1 });

// ==================== VIRTUALS ====================
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    phoneNumber: this.phoneNumber,
    profilePicture: this.profilePicture,
    preferences: this.preferences
  };
});

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ==================== MIDDLEWARE (PRE) ====================

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12); // Increased salt rounds for better security
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update passwordChangedAt when password is changed
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change
  next();
});

// Automatically exclude deleted users from all find queries by default
userSchema.pre(/^find/, function(next) {
  // Only apply if not explicitly asked to include deleted
  if (!this.getOptions().includeDeleted) {
    this.find({ deletedAt: null });
  }
  next();
});

// ==================== INSTANCE METHODS ====================

/**
 * Check if password is correct
 */
userSchema.methods.isPasswordCorrect = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Generate JWT authentication token
 */
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
      name: this.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Check if password was changed after JWT was issued
 */
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

/**
 * Generate password reset token
 */
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

/**
 * Generate email verification token
 */
userSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

/**
 * Increment login attempts and lock account if needed
 */
userSchema.methods.incLoginAttempts = function() {
  // If lock has expired, reset attempts and remove lock
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise increment attempts
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock the account if attempts exceed 5 and it's not already locked
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // Lock for 2 hours
  }
  
  return this.updateOne(updates);
};

// ==================== STATIC METHODS ====================

/**
 * Find user by email with password field included
 */
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email }).select('+password');
};

/**
 * Find user by email verification token
 */
userSchema.statics.findByEmailVerificationToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  return this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });
};

/**
 * Find user by password reset token
 */
userSchema.statics.findByPasswordResetToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
};

/**
 * Find including deleted users (override default filter)
 */
userSchema.statics.findWithDeleted = function() {
  return this.find().setOptions({ includeDeleted: true });
};

/**
 * Find only deleted users
 */
userSchema.statics.findDeleted = function() {
  return this.find({ deletedAt: { $ne: null } }).setOptions({ includeDeleted: true });
};

const User = mongoose.model('User', userSchema);

module.exports = User;