/**
 * Compliance Record Model
 * Tracks compliance status over time for businesses
 */

const mongoose = require('mongoose');

const complianceRecordSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  checkDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  complianceLevel: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    required: true
  },
  checks: {
    tax: {
      score: Number,
      status: String,
      issues: [mongoose.Schema.Types.Mixed]
    },
    registration: {
      score: Number,
      status: String,
      issues: [mongoose.Schema.Types.Mixed]
    },
    social: {
      score: Number,
      status: String,
      issues: [mongoose.Schema.Types.Mixed]
    },
    dataProtection: {
      score: Number,
      status: String,
      issues: [mongoose.Schema.Types.Mixed]
    },
    consumer: {
      score: Number,
      status: String,
      issues: [mongoose.Schema.Types.Mixed]
    }
  },
  alerts: [{
    type: {
      type: String,
      enum: ['warning', 'critical', 'info']
    },
    message: String,
    deadline: Date,
    dismissed: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  recommendations: [{
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    action: String,
    timeline: String,
    resources: [String],
    completed: {
      type: Boolean,
      default: false
    }
  }],
  nextReviewDate: {
    type: Date,
    required: true
  },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes
complianceRecordSchema.index({ businessId: 1, checkDate: -1 });
complianceRecordSchema.index({ businessId: 1, complianceLevel: 1 });
complianceRecordSchema.index({ nextReviewDate: 1 });

// Get latest compliance record for a business
complianceRecordSchema.statics.getLatest = function(businessId) {
  return this.findOne({ businessId })
    .sort({ checkDate: -1 })
    .lean();
};

// Get compliance history
complianceRecordSchema.statics.getHistory = function(businessId, limit = 12) {
  return this.find({ businessId })
    .sort({ checkDate: -1 })
    .limit(limit)
    .select('checkDate overallScore complianceLevel alerts')
    .lean();
};

// Get businesses needing review
complianceRecordSchema.statics.getBusinessesForReview = function() {
  return this.find({
    nextReviewDate: { $lte: new Date() }
  })
    .populate('businessId', 'name email')
    .sort({ nextReviewDate: 1 });
};

// Instance methods
complianceRecordSchema.methods.addAlert = function(alert) {
  this.alerts.push({
    ...alert,
    createdAt: new Date()
  });
  return this.save();
};

complianceRecordSchema.methods.dismissAlert = function(alertId) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.dismissed = true;
  }
  return this.save();
};

complianceRecordSchema.methods.markRecommendationCompleted = function(recommendationId) {
  const recommendation = this.recommendations.id(recommendationId);
  if (recommendation) {
    recommendation.completed = true;
  }
  return this.save();
};

module.exports = mongoose.model('ComplianceRecord', complianceRecordSchema);