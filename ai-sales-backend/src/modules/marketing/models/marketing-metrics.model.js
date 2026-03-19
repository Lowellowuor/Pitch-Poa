const mongoose = require('mongoose');

const marketingMetricsSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  channel: {
    type: String,
    enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'google', 'email', 'sms', 'whatsapp', 'tiktok', 'youtube', 'total'],
    required: true
  },
  metrics: {
    impressions: Number,
    reach: Number,
    clicks: Number,
    conversions: Number,
    spend: Number,
    revenue: Number,
    engagement: {
      likes: Number,
      shares: Number,
      comments: Number,
      saves: Number
    },
    email: {
      sent: Number,
      opened: Number,
      clicked: Number,
      bounced: Number,
      unsubscribed: Number
    },
    sms: {
      sent: Number,
      delivered: Number,
      failed: Number,
      replied: Number
    },
    whatsapp: {
      sent: Number,
      delivered: Number,
      read: Number,
      replied: Number
    }
  },
  derived: {
    ctr: Number,
    conversionRate: Number,
    cpc: Number,
    cpm: Number,
    cpa: Number,
    roas: Number,
    roi: Number
  },
  campaigns: [{
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign'
    },
    metrics: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Indexes
marketingMetricsSchema.index({ businessId: 1, date: -1 });
marketingMetricsSchema.index({ businessId: 1, channel: 1, date: -1 });
marketingMetricsSchema.index({ 'derived.roas': -1 });

// Pre-save middleware to calculate derived metrics
marketingMetricsSchema.pre('save', function(next) {
  const m = this.metrics;
  
  // Calculate CTR
  if (m.impressions > 0) {
    this.derived.ctr = (m.clicks / m.impressions) * 100;
  }
  
  // Calculate conversion rate
  if (m.clicks > 0) {
    this.derived.conversionRate = (m.conversions / m.clicks) * 100;
  }
  
  // Calculate CPC
  if (m.clicks > 0 && m.spend) {
    this.derived.cpc = m.spend / m.clicks;
  }
  
  // Calculate CPM
  if (m.impressions > 0 && m.spend) {
    this.derived.cpm = (m.spend / m.impressions) * 1000;
  }
  
  // Calculate CPA
  if (m.conversions > 0 && m.spend) {
    this.derived.cpa = m.spend / m.conversions;
  }
  
  // Calculate ROAS
  if (m.spend > 0 && m.revenue) {
    this.derived.roas = m.revenue / m.spend;
  }
  
  // Calculate ROI
  if (m.spend > 0 && m.revenue) {
    this.derived.roi = ((m.revenue - m.spend) / m.spend) * 100;
  }
  
  next();
});

// Static method to get aggregated metrics
marketingMetricsSchema.statics.getAggregated = async function(businessId, startDate, endDate, channel = null) {
  const match = {
    businessId: mongoose.Types.ObjectId(businessId),
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (channel) {
    match.channel = channel;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: channel ? '$channel' : null,
        impressions: { $sum: '$metrics.impressions' },
        clicks: { $sum: '$metrics.clicks' },
        conversions: { $sum: '$metrics.conversions' },
        spend: { $sum: '$metrics.spend' },
        revenue: { $sum: '$metrics.revenue' },
        engagement: {
          likes: { $sum: '$metrics.engagement.likes' },
          shares: { $sum: '$metrics.engagement.shares' },
          comments: { $sum: '$metrics.engagement.comments' }
        }
      }
    },
    {
      $addFields: {
        ctr: { $multiply: [{ $divide: ['$clicks', '$impressions'] }, 100] },
        conversionRate: { $multiply: [{ $divide: ['$conversions', '$clicks'] }, 100] },
        cpc: { $divide: ['$spend', '$clicks'] },
        cpm: { $multiply: [{ $divide: ['$spend', '$impressions'] }, 1000] },
        cpa: { $divide: ['$spend', '$conversions'] },
        roas: { $divide: ['$revenue', '$spend'] }
      }
    }
  ]);
};

module.exports = mongoose.model('MarketingMetrics', marketingMetricsSchema);