/**
 * Business Permit Model
 * Tracks business permits and their renewal status
 */

const mongoose = require('mongoose');

const businessPermitSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  permitNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: [
      'single_business_permit',
      'county_license',
      'health_certificate',
      'food_handling',
      'liquor_license',
      'fire_safety',
      'environmental',
      'other'
    ],
    required: true
  },
  issuingBody: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  renewalDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'pending_renewal', 'suspended', 'revoked'],
    default: 'active'
  },
  fee: {
    amount: Number,
    paid: Boolean,
    paymentDate: Date,
    receiptNumber: String
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: Date
  }],
  conditions: [String],
  inspections: [{
    date: Date,
    officer: String,
    result: String,
    report: String
  }],
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

// Indexes
businessPermitSchema.index({ businessId: 1, status: 1 });
businessPermitSchema.index({ expiryDate: 1 });
businessPermitSchema.index({ type: 1, issuingBody: 1 });

// Update timestamps
businessPermitSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Check if permit is expiring soon
businessPermitSchema.virtual('daysUntilExpiry').get(function() {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
});

businessPermitSchema.virtual('isExpiringSoon').get(function() {
  return this.daysUntilExpiry <= 60 && this.daysUntilExpiry > 0;
});

businessPermitSchema.virtual('isExpired').get(function() {
  return new Date() > new Date(this.expiryDate);
});

// Static methods
businessPermitSchema.statics.findExpiring = function(days = 60) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    expiryDate: { 
      $lte: futureDate,
      $gt: new Date()
    }
  }).sort({ expiryDate: 1 });
};

businessPermitSchema.statics.findExpired = function() {
  return this.find({
    status: 'active',
    expiryDate: { $lt: new Date() }
  }).sort({ expiryDate: 1 });
};

businessPermitSchema.statics.getByBusiness = function(businessId) {
  return this.find({ businessId })
    .sort({ expiryDate: 1 })
    .lean();
};

// Instance methods
businessPermitSchema.methods.renew = async function(renewalData) {
  this.status = 'pending_renewal';
  this.renewalDate = new Date();
  this.metadata = {
    ...this.metadata,
    renewalRequest: renewalData
  };
  return this.save();
};

businessPermitSchema.methods.markAsRenewed = function(newPermitData) {
  this.status = 'expired'; // Old permit expired
  
  // Create new permit record
  return this.model('BusinessPermit').create({
    ...newPermitData,
    businessId: this.businessId,
    issueDate: new Date()
  });
};

module.exports = mongoose.model('BusinessPermit', businessPermitSchema);