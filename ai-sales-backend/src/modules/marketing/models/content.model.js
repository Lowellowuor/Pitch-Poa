const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  type: {
    type: String,
    enum: ['social', 'email', 'sms', 'whatsapp', 'ad', 'video', 'blog', 'landing'],
    required: true
  },
  name: String,
  channel: String,
  content: {
    headline: String,
    body: String,
    cta: String,
    media: [{
      type: String,
      url: String
    }],
    variations: [mongoose.Schema.Types.Mixed]
  },
  metadata: {
    tone: String,
    targetAudience: String,
    keywords: [String],
    hashtags: [String],
    characterCount: Number,
    readingTime: Number
  },
  generatedBy: {
    type: String,
    enum: ['ai', 'user', 'template'],
    default: 'ai'
  },
  tags: [String],
  usedIn: [{
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign'
    },
    usedAt: Date,
    performance: mongoose.Schema.Types.Mixed
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Indexes
contentSchema.index({ businessId: 1, type: 1 });
contentSchema.index({ businessId: 1, tags: 1 });
contentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Content', contentSchema);