const mongoose = require('mongoose');

const analyticsCacheSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['sales', 'financial', 'customers', 'products', 'market']
  },
  period: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  cachedAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Auto-delete after 1 hour
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

// Compound index for efficient lookups
analyticsCacheSchema.index({ businessId: 1, type: 1, period: 1 });

// Static method to get cached data
analyticsCacheSchema.statics.getCached = async function(businessId, type, period) {
  return this.findOne({
    businessId,
    type,
    period,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to set cache
analyticsCacheSchema.statics.setCache = async function(businessId, type, period, data, ttl = 3600) {
  const expiresAt = new Date(Date.now() + ttl * 1000);
  
  return this.findOneAndUpdate(
    { businessId, type, period },
    { data, cachedAt: new Date(), expiresAt },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('AnalyticsCache', analyticsCacheSchema);