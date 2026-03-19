const mongoose = require('mongoose');

const businessIdeaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  input: {
    skills: [String],
    interests: [String],
    location: {
      region: String,
      lat: Number,
      lng: Number,
    },
    capital: {
      amount: Number,
      currency: { type: String, default: 'KES' },
    },
    timeCommitment: String,
    experience: String,
  },

  ideas: [{
    title: String,
    tagline: String,
    description: String,
    sector: String,
    
    marketAnalysis: {
      targetCustomers: [String],
      demandLevel: String,
      competitionLevel: String,
      marketSize: String,
      growthPotential: String,
    },

    financialProjections: {
      startupCosts: {
        min: Number,
        max: Number,
        average: Number,
        breakdown: [{
          item: String,
          cost: Number,
        }],
      },
      monthlyExpenses: {
        rent: Number,
        utilities: Number,
        salaries: Number,
        marketing: Number,
        other: Number,
      },
      revenueProjections: {
        month1: Number,
        month3: Number,
        month6: Number,
        year1: Number,
        profitMargin: Number,
      },
      breakevenMonths: Number,
    },

    resources: {
      equipment: [String],
      skills: [String],
      licenses: [String],
      suppliers: [String],
    },

    actionPlan: [{
      week: Number,
      action: String,
      cost: Number,
    }],

    risks: [String],
    opportunities: [String],

    kenyaSpecific: {
      relevantRegulations: [String],
      governmentSupport: [String],
      localSuccessFactors: [String],
    },

    // Real market data from APIs
    realMarketData: {
      competitors: mongoose.Schema.Types.Mixed,
      areaAnalysis: mongoose.Schema.Types.Mixed,
      industryTrends: mongoose.Schema.Types.Mixed,
    },

    confidence: Number,
  }],

  // Economic context from World Bank
  economicContext: mongoose.Schema.Types.Mixed,

  // Regulatory data from KRA
  regulatoryContext: [mongoose.Schema.Types.Mixed],

  // Market trends
  marketTrends: mongoose.Schema.Types.Mixed,

  // Generated marketing content
  marketingContent: mongoose.Schema.Types.Mixed,

  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating',
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
businessIdeaSchema.index({ userId: 1, createdAt: -1 });
businessIdeaSchema.index({ 'ideas.sector': 1 });
businessIdeaSchema.index({ 'ideas.confidence': -1 });

// Update timestamp
businessIdeaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BusinessIdea', businessIdeaSchema);