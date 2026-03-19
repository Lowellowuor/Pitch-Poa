/**
 * Compliance Middleware
 * Real-time compliance checks and enforcement
 */

const logger = require('../config/logger');
const ComplianceRecord = require('../models/ComplianceRecord');
const BusinessPermit = require('../models/BusinessPermit');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');

class ComplianceMiddleware {
  /**
   * Check if business is compliant before allowing operations
   */
  async requireCompliance(req, res, next) {
    try {
      const businessId = req.params.businessId || req.body.businessId;

      if (!businessId) {
        return next();
      }

      // Get latest compliance record
      const compliance = await ComplianceRecord.getLatest(businessId);

      if (!compliance) {
        logger.warn(`No compliance record found for business ${businessId}`);
        return next();
      }

      // Check if business is severely non-compliant
      if (compliance.overallScore < 50) {
        logger.warn(`Blocked operation for non-compliant business ${businessId}`);
        
        await AuditLog.log({
          userId: req.user.id,
          businessId,
          action: 'blocked',
          resourceType: 'compliance_record',
          status: 'blocked',
          failureReason: 'Business non-compliant',
          metadata: {
            score: compliance.overallScore,
            ipAddress: req.ip
          }
        });

        return next(new ApiError(403, 'Business operations blocked due to compliance issues'));
      }

      // Check for critical alerts
      const criticalAlerts = compliance.alerts?.filter(
        a => a.type === 'critical' && !a.dismissed
      );

      if (criticalAlerts?.length > 0) {
        logger.warn(`Business ${businessId} has critical alerts`);
        
        // Allow read operations but block writes
        if (req.method !== 'GET') {
          return next(new ApiError(403, 'Write operations blocked due to critical compliance alerts'));
        }
      }

      next();
    } catch (error) {
      logger.error('Compliance check middleware failed:', error);
      next();
    }
  }

  /**
   * Check permit validity before allowing operations
   */
  async requireValidPermit(req, res, next) {
    try {
      const businessId = req.params.businessId || req.body.businessId;

      if (!businessId) {
        return next();
      }

      // Check for expired permits
      const expiredPermits = await BusinessPermit.find({
        businessId,
        status: 'active',
        expiryDate: { $lt: new Date() }
      });

      if (expiredPermits.length > 0) {
        logger.warn(`Business ${businessId} has ${expiredPermits.length} expired permits`);

        // Block operations if critical permits are expired
        const criticalPermits = expiredPermits.filter(p => 
          ['single_business_permit', 'health_certificate', 'liquor_license'].includes(p.type)
        );

        if (criticalPermits.length > 0 && req.method !== 'GET') {
          return next(new ApiError(403, 'Operations blocked due to expired business permits'));
        }
      }

      next();
    } catch (error) {
      logger.error('Permit check middleware failed:', error);
      next();
    }
  }

  /**
   * Log all data access for audit trail (Data Protection Act compliance)
   */
  async auditDataAccess(req, res, next) {
    const startTime = Date.now();

    // Store original send function
    const originalSend = res.send;

    // Override send function to log after response
    res.send = async function(body) {
      try {
        const businessId = req.params.businessId || req.body.businessId;
        
        // Log data access
        if (businessId && req.method === 'GET') {
          await AuditLog.log({
            userId: req.user?.id,
            businessId,
            action: 'read',
            resourceType: req.baseUrl.split('/').pop() || 'unknown',
            status: res.statusCode < 400 ? 'success' : 'failure',
            metadata: {
              method: req.method,
              path: req.path,
              query: req.query,
              responseTime: Date.now() - startTime,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent')
            }
          });
        }
      } catch (error) {
        logger.error('Audit logging failed:', error);
      }

      // Call original send
      return originalSend.call(this, body);
    };

    next();
  }

  /**
   * Check data export limits (for data protection)
   */
  async checkExportLimits(req, res, next) {
    try {
      if (req.path.includes('/export') || req.query.export) {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count exports today
        const exportsToday = await AuditLog.countDocuments({
          userId,
          action: 'export',
          timestamp: { $gte: today }
        });

        // Limit to 10 exports per day
        if (exportsToday >= 10) {
          return next(new ApiError(429, 'Daily export limit reached'));
        }

        // Log the export attempt
        await AuditLog.log({
          userId,
          action: 'export',
          resourceType: 'data',
          metadata: {
            path: req.path,
            query: req.query,
            ipAddress: req.ip
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Export limit check failed:', error);
      next();
    }
  }

  /**
   * Verify data consent before processing personal data
   */
  async verifyConsent(req, res, next) {
    try {
      // Skip for non-personal data routes
      if (!this.isPersonalDataRoute(req.path)) {
        return next();
      }

      const userId = req.user.id;

      // Check if user has given consent
      const consentRecord = await AuditLog.findOne({
        userId,
        action: 'consent_given',
        'metadata.purpose': 'data_processing',
        timestamp: { $gt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // Within last year
      }).sort({ timestamp: -1 });

      const consentWithdrawn = await AuditLog.findOne({
        userId,
        action: 'consent_withdrawn',
        timestamp: { $gt: consentRecord?.timestamp || new Date(0) }
      });

      if (!consentRecord || consentWithdrawn) {
        return next(new ApiError(403, 'Consent required for data processing'));
      }

      next();
    } catch (error) {
      logger.error('Consent verification failed:', error);
      next();
    }
  }

  /**
   * Check if route involves personal data
   */
  isPersonalDataRoute(path) {
    const personalDataRoutes = [
      '/user',
      '/customer',
      '/profile',
      '/contact',
      '/personal'
    ];
    
    return personalDataRoutes.some(route => path.includes(route));
  }

  /**
   * Rate limiting for compliance-sensitive operations
   */
  complianceRateLimit(req, res, next) {
    // Implementation would use a rate limiter like express-rate-limit
    // This is a placeholder for the concept
    next();
  }
}

module.exports = new ComplianceMiddleware();