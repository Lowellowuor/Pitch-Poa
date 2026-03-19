/**
 * Tax Filing Model
 * Stores tax filing history for businesses
 */

const mongoose = require('mongoose');

const taxFilingSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'vat',
      'income_tax',
      'income_tax_installment',
      'withholding_tax',
      'paye',
      'turnover_tax',
      'excise_duty'
    ],
    required: true
  },
  period: {
    type: String,
    description: 'Format: YYYY-MM for monthly, YYYY for annual'
  },
  year: {
    type: Number,
    description: 'Year of filing'
  },
  filingDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  balanceDue: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: [
      'draft',
      'filed',
      'filed_with_balance',
      'paid',
      'overdue',
      'late_filed',
      'cancelled'
    ],
    default: 'filed'
  },
  kraReference: {
    type: String,
    unique: true,
    sparse: true
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: Date
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    description: 'Additional filing data (sales, purchases, etc.)'
  },
  filedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient querying
taxFilingSchema.index({ businessId: 1, type: 1, period: 1 }, { unique: true });
taxFilingSchema.index({ businessId: 1, dueDate: 1 });
taxFilingSchema.index({ status: 1, dueDate: 1 });

// Update timestamps on save
taxFilingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate balance due
taxFilingSchema.pre('save', function(next) {
  if (this.amount && this.paidAmount) {
    this.balanceDue = this.amount - this.paidAmount;
  }
  next();
});

// Virtual for days overdue
taxFilingSchema.virtual('daysOverdue').get(function() {
  if (this.status === 'paid') return 0;
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  if (today > dueDate) {
    return Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for penalty amount
taxFilingSchema.virtual('penaltyAmount').get(function() {
  const daysOverdue = this.daysOverdue;
  if (daysOverdue <= 0) return 0;
  
  // 2% interest per month on unpaid tax
  const monthlyRate = 0.02;
  const monthsOverdue = Math.ceil(daysOverdue / 30);
  return this.balanceDue * monthlyRate * monthsOverdue;
});

// Instance methods
taxFilingSchema.methods.markAsPaid = async function(amount, reference) {
  this.paidAmount = amount;
  this.status = this.balanceDue <= 0 ? 'paid' : 'filed_with_balance';
  this.metadata = {
    ...this.metadata,
    paymentReference: reference,
    paymentDate: new Date()
  };
  return this.save();
};

taxFilingSchema.methods.calculatePenalty = function() {
  return {
    daysOverdue: this.daysOverdue,
    penaltyAmount: this.penaltyAmount,
    totalDue: this.balanceDue + this.penaltyAmount
  };
};

// Static methods
taxFilingSchema.statics.findOverdue = function() {
  return this.find({
    status: { $nin: ['paid', 'cancelled'] },
    dueDate: { $lt: new Date() }
  }).sort({ dueDate: 1 });
};

taxFilingSchema.statics.findPendingForPeriod = function(businessId, type, period) {
  return this.findOne({
    businessId,
    type,
    period,
    status: { $in: ['draft', 'filed', 'filed_with_balance'] }
  });
};

taxFilingSchema.statics.getFilingHistory = function(businessId, limit = 12) {
  return this.find({ businessId })
    .sort({ filingDate: -1 })
    .limit(limit)
    .populate('filedBy', 'name email');
};

module.exports = mongoose.model('TaxFiling', taxFilingSchema);