/**
 * Audit Log Model
 * For data protection compliance - tracks all data access and modifications
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: [
      'create',
      'read',
      'update',
      'delete',
      'export',
      'login',
      'logout',
      'permission_change',
      'data_access',
      'consent_given',
      'consent_withdrawn',
      'data_deletion_request'
    ],
    required: true
  },
  resourceType: {
    type: String,
    enum: [
      'business',
      'user',
      'product',
      'sale',
      'customer',
      'invoice',
      'compliance_record',
      'tax_filing',
      'permit',
      'payment',
      'setting'
    ],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.Mixed,
    description: 'ID of the resource being accessed'
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    fields: [String]
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    location: String,
    deviceInfo: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'blocked'],
    default: 'success'
  },
  failureReason: String,
  consent: {
    provided: Boolean,
    purpose: String,
    expiryDate: Date
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  retentionUntil: {
    type: Date,
    description: 'When this log should be deleted per data protection laws'
  }
});

// Indexes for efficient querying
auditLogSchema.index({ businessId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days retention

// Set retention period (6 years for financial data, 90 days for general logs)
auditLogSchema.pre('save', function(next) {
  if (!this.retentionUntil) {
    const retentionPeriod = this.resourceType === 'tax_filing' 
      ? 6 * 365 * 24 * 60 * 60 * 1000 // 6 years for tax records
      : 90 * 24 * 60 * 60 * 1000; // 90 days for general logs
    
    this.retentionUntil = new Date(Date.now() + retentionPeriod);
  }
  next();
});

// Static methods
auditLogSchema.statics.log = function({
  userId,
  businessId,
  action,
  resourceType,
  resourceId,
  changes = {},
  metadata = {},
  status = 'success',
  failureReason = null
}) {
  return this.create({
    userId,
    businessId,
    action,
    resourceType,
    resourceId,
    changes,
    metadata: {
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      sessionId: metadata.sessionId,
      ...metadata
    },
    status,
    failureReason
  });
};

auditLogSchema.statics.getUserActivity = function(userId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  return this.find({
    userId,
    timestamp: { $gte: since }
  }).sort({ timestamp: -1 });
};

auditLogSchema.statics.getResourceHistory = function(resourceType, resourceId) {
  return this.find({
    resourceType,
    resourceId
  })
    .sort({ timestamp: -1 })
    .populate('userId', 'name email');
};

auditLogSchema.statics.getDataAccessLogs = function(businessId, days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  return this.find({
    businessId,
    action: { $in: ['read', 'export', 'data_access'] },
    timestamp: { $gte: since }
  }).sort({ timestamp: -1 });
};

// Instance methods
auditLogSchema.methods.anonymize = function() {
  // For data deletion requests, anonymize PII in logs
  this.metadata.ipAddress = '[REDACTED]';
  this.metadata.userAgent = '[REDACTED]';
  return this.save();
};

module.exports = mongoose.model('AuditLog', auditLogSchema);