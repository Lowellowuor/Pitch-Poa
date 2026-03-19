const mongoose = require('mongoose');

const audienceSegmentSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  criteria: {
    demographics: {
      ageRange: {
        min: Number,
        max: Number
      },
      gender: [String],
      location: [String],
      income: {
        min: Number,
        max: Number
      },
      education: [String],
      occupation: [String]
    },
    behavior: {
      purchaseHistory: {
        minTransactions: Number,
        minSpent: Number,
        lastPurchaseDays: Number
      },
      engagement: {
        emailOpens: Number,
        smsReplies: Number,
        whatsappReads: Number,
        socialInteractions: Number
      },
      interests: [String],
      browsingBehavior: mongoose.Schema.Types.Mixed
    },
    custom: mongoose.Schema.Types.Mixed
  },
  size: {
    type: Number,
    default: 0
  },
  source: {
    type: String,
    enum: ['manual', 'import', 'lookalike', 'ai-generated'],
    default: 'manual'
  },
  lookalike: {
    sourceSegmentId: mongoose.Schema.Types.ObjectId,
    country: String,
    size: Number
  },
  performance: {
    conversionRate: Number,
    averageOrderValue: Number,
    lifetimeValue: Number,
    engagement: mongoose.Schema.Types.Mixed
  },
  campaigns: [{
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign'
    },
    performance: mongoose.Schema.Types.Mixed
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Indexes
audienceSegmentSchema.index({ businessId: 1, name: 1 });
audienceSegmentSchema.index({ 'performance.conversionRate': -1 });
audienceSegmentSchema.index({ size: -1 });

// Method to calculate segment size
audienceSegmentSchema.methods.calculateSize = async function() {
  // This would query the customer database with the criteria
  // For now, return placeholder
  return 0;
};

module.exports = mongoose.model('AudienceSegment', audienceSegmentSchema);