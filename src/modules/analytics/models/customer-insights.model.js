const mongoose = require('mongoose');

const customerInsightsSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  
  // Demographics
  demographics: {
    age: Number,
    gender: String,
    location: {
      county: String,
      constituency: String,
      ward: String
    },
    occupation: String
  },
  
  // Behavior metrics
  behavior: {
    firstPurchaseDate: Date,
    lastPurchaseDate: Date,
    totalSpent: Number,
    totalTransactions: Number,
    averageOrderValue: Number,
    purchaseFrequency: Number, // days between purchases
    preferredChannel: String,
    preferredProducts: [{
      productId: mongoose.Schema.Types.ObjectId,
      count: Number
    }]
  },
  
  // Loyalty metrics
  loyalty: {
    score: Number, // 0-100
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum']
    },
    points: Number,
    lastActivity: Date
  },
  
  // Predictions
  predictions: {
    churnRisk: Number, // 0-1
    nextPurchaseDate: Date,
    lifetimeValue: Number,
    segment: String
  },
  
  // Preferences
  preferences: {
    communication: {
      email: Boolean,
      sms: Boolean,
      whatsapp: Boolean
    },
    categories: [String],
    priceSensitivity: String,
    dealHunter: Boolean
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for analytics
customerInsightsSchema.index({ businessId: 1, 'loyalty.score': -1 });
customerInsightsSchema.index({ businessId: 1, 'predictions.churnRisk': -1 });
customerInsightsSchema.index({ businessId: 1, 'behavior.totalSpent': -1 });

// Virtual for customer lifetime value
customerInsightsSchema.virtual('ltv').get(function() {
  return this.predictions?.lifetimeValue || this.behavior.totalSpent;
});

// Method to update insights
customerInsightsSchema.methods.updateInsights = async function(transaction) {
  // Update last purchase
  this.behavior.lastPurchaseDate = transaction.date;
  this.behavior.totalSpent += transaction.amount;
  this.behavior.totalTransactions += 1;
  this.behavior.averageOrderValue = this.behavior.totalSpent / this.behavior.totalTransactions;
  
  // Update purchase frequency
  if (this.behavior.firstPurchaseDate) {
    const daysSinceFirst = (transaction.date - this.behavior.firstPurchaseDate) / (1000 * 60 * 60 * 24);
    this.behavior.purchaseFrequency = daysSinceFirst / this.behavior.totalTransactions;
  }
  
  // Update preferred channel
  if (!this.behavior.preferredChannel) {
    this.behavior.preferredChannel = transaction.channel;
  }
  
  // Update loyalty score
  await this.calculateLoyaltyScore();
  
  this.lastUpdated = new Date();
  await this.save();
};

// Method to calculate loyalty score
customerInsightsSchema.methods.calculateLoyaltyScore = async function() {
  let score = 0;
  
  // Recency (30 points max)
  const daysSinceLastPurchase = this.behavior.lastPurchaseDate ?
    (Date.now() - this.behavior.lastPurchaseDate) / (1000 * 60 * 60 * 24) : 999;
  
  if (daysSinceLastPurchase < 7) score += 30;
  else if (daysSinceLastPurchase < 30) score += 20;
  else if (daysSinceLastPurchase < 60) score += 10;
  
  // Frequency (40 points max)
  if (this.behavior.totalTransactions > 20) score += 40;
  else if (this.behavior.totalTransactions > 10) score += 30;
  else if (this.behavior.totalTransactions > 5) score += 20;
  else if (this.behavior.totalTransactions > 1) score += 10;
  
  // Monetary value (30 points max)
  const avgSpend = this.behavior.averageOrderValue || 0;
  if (avgSpend > 10000) score += 30;
  else if (avgSpend > 5000) score += 20;
  else if (avgSpend > 1000) score += 10;
  
  this.loyalty.score = Math.min(100, score);
  
  // Set tier based on score
  if (score >= 80) this.loyalty.tier = 'platinum';
  else if (score >= 60) this.loyalty.tier = 'gold';
  else if (score >= 40) this.loyalty.tier = 'silver';
  else this.loyalty.tier = 'bronze';
};

module.exports = mongoose.model('CustomerInsights', customerInsightsSchema);