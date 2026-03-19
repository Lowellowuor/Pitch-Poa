const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  channel: {
    type: String,
    enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'google', 'email', 'sms', 'whatsapp', 'tiktok', 'youtube'],
    required: true
  },
  type: {
    type: String,
    enum: ['awareness', 'consideration', 'conversion', 'retention', 'promotion'],
    required: true
  },
  goal: {
    type: String,
    required: true
  },
  targetAudience: {
    segments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AudienceSegment'
    }],
    demographics: {
      ageRange: {
        min: Number,
        max: Number
      },
      gender: [String],
      location: [String],
      interests: [String],
      behaviors: [String]
    },
    customAudience: mongoose.Schema.Types.Mixed
  },
  budget: {
    total: Number,
    daily: Number,
    currency: {
      type: String,
      default: 'KES'
    },
    spent: {
      type: Number,
      default: 0
    }
  },
  schedule: {
    startDate: Date,
    endDate: Date,
    timezone: String,
    hours: [{
      day: String,
      start: String,
      end: String
    }]
  },
  content: {
    primary: mongoose.Schema.Types.Mixed,
    variations: [mongoose.Schema.Types.Mixed],
    media: [{
      type: String,
      url: String,
      thumbnail: String
    }]
  },
  externalId: String, // ID on external platform (Facebook, Google, etc.)
  externalUrl: String,
  tracking: {
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmContent: String,
    trackingPixel: String,
    conversionTracking: Boolean
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'failed'],
    default: 'draft'
  },
  performance: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    cpa: { type: Number, default: 0 },
    roas: { type: Number, default: 0 }
  },
  abTest: {
    isTest: { type: Boolean, default: false },
    variants: [{
      name: String,
      content: mongoose.Schema.Types.Mixed,
      audience: Number, // percentage
      performance: mongoose.Schema.Types.Mixed
    }],
    winner: String,
    confidence: Number
  },
  launchedAt: Date,
  pausedAt: Date,
  completedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
campaignSchema.index({ businessId: 1, status: 1 });
campaignSchema.index({ businessId: 1, channel: 1 });
campaignSchema.index({ businessId: 1, 'schedule.startDate': 1 });
campaignSchema.index({ 'performance.roas': -1 });

// Virtual for ROI
campaignSchema.virtual('roi').get(function() {
  if (this.performance.spend > 0) {
    return ((this.performance.revenue - this.performance.spend) / this.performance.spend) * 100;
  }
  return 0;
});

// Virtual for remaining budget
campaignSchema.virtual('remainingBudget').get(function() {
  return this.budget.total - this.performance.spend;
});

// Method to update performance
campaignSchema.methods.updatePerformance = async function(metrics) {
  this.performance = { ...this.performance, ...metrics };
  
  // Calculate derived metrics
  if (this.performance.impressions > 0) {
    this.performance.ctr = (this.performance.clicks / this.performance.impressions) * 100;
  }
  
  if (this.performance.clicks > 0) {
    this.performance.conversionRate = (this.performance.conversions / this.performance.clicks) * 100;
    this.performance.cpc = this.performance.spend / this.performance.clicks;
  }
  
  if (this.performance.conversions > 0) {
    this.performance.cpa = this.performance.spend / this.performance.conversions;
  }
  
  if (this.performance.spend > 0) {
    this.performance.roas = this.performance.revenue / this.performance.spend;
  }
  
  await this.save();
};

// Method to check if campaign is active
campaignSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' &&
         (!this.schedule.endDate || this.schedule.endDate > now);
};

// Static method to get active campaigns
campaignSchema.statics.getActiveCampaigns = function(businessId) {
  return this.find({
    businessId,
    status: 'active',
    $or: [
      { 'schedule.endDate': { $exists: false } },
      { 'schedule.endDate': { $gt: new Date() } }
    ]
  });
};

module.exports = mongoose.model('Campaign', campaignSchema);