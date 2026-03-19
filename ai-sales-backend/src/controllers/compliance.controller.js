/**
 * Compliance Controller
 * Handles HTTP requests for compliance management
 */

const { validationResult } = require('express-validator');
const logger = require('../config/logger');
const {
  kenyaCompliance,
  taxCompliance,
  businessRegistration,
  socialCompliance,
  dataProtection,
  consumerProtection
} = require('../compliance');
const TaxCalculator = require('../compliance/calculators/tax-calculator');
const TaxFiling = require('../models/TaxFiling');
const ComplianceRecord = require('../models/ComplianceRecord');
const BusinessPermit = require('../models/BusinessPermit');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');

const calculator = new TaxCalculator();

class ComplianceController {
  /**
   * Perform full compliance check
   */
  async checkCompliance(req, res, next) {
    try {
      const { businessId } = req.params;
      const { businessData } = req.body;

      logger.info(`Compliance check requested for business: ${businessId}`);

      const complianceReport = await kenyaCompliance.performFullComplianceCheck(
        businessId,
        businessData
      );

      // Log the compliance check
      await AuditLog.log({
        userId: req.user.id,
        businessId,
        action: 'read',
        resourceType: 'compliance_record',
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.json({
        success: true,
        data: complianceReport
      });
    } catch (error) {
      logger.error('Compliance check failed:', error);
      next(new ApiError(500, 'Failed to perform compliance check'));
    }
  }

  /**
   * Get compliance dashboard
   */
  async getDashboard(req, res, next) {
    try {
      const { businessId } = req.params;

      const dashboard = await kenyaCompliance.getComplianceDashboard(businessId);

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Failed to get dashboard:', error);
      next(new ApiError(500, 'Failed to get compliance dashboard'));
    }
  }

  /**
   * File compliance report
   */
  async fileReport(req, res, next) {
    try {
      const { businessId } = req.params;
      const { reportType, data } = req.body;

      const result = await kenyaCompliance.fileComplianceReport(
        businessId,
        reportType,
        data
      );

      // Log the filing
      await AuditLog.log({
        userId: req.user.id,
        businessId,
        action: 'create',
        resourceType: 'compliance_record',
        metadata: {
          reportType,
          reference: result.reference,
          ipAddress: req.ip
        }
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Failed to file report:', error);
      next(new ApiError(500, 'Failed to file compliance report'));
    }
  }

  /**
   * Get tax compliance status
   */
  async getTaxStatus(req, res, next) {
    try {
      const { businessId } = req.params;
      const businessData = req.body;

      const taxStatus = await taxCompliance.checkTaxCompliance(businessId, businessData);

      res.json({
        success: true,
        data: taxStatus
      });
    } catch (error) {
      logger.error('Failed to get tax status:', error);
      next(new ApiError(500, 'Failed to get tax compliance status'));
    }
  }

  /**
   * File monthly tax return
   */
  async fileMonthlyTax(req, res, next) {
    try {
      const { businessId } = req.params;
      const filingData = req.body;

      // Validate filing data
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await taxCompliance.fileMonthlyReturn(businessId, filingData);

      // Log the filing
      await AuditLog.log({
        userId: req.user.id,
        businessId,
        action: 'create',
        resourceType: 'tax_filing',
        resourceId: result.reference,
        metadata: {
          period: filingData.period,
          type: 'monthly',
          ipAddress: req.ip
        }
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Failed to file monthly tax:', error);
      next(new ApiError(500, 'Failed to file monthly tax return'));
    }
  }

  /**
   * File annual tax return
   */
  async fileAnnualTax(req, res, next) {
    try {
      const { businessId } = req.params;
      const filingData = req.body;

      const result = await taxCompliance.fileAnnualReturn(businessId, filingData);

      // Log the filing
      await AuditLog.log({
        userId: req.user.id,
        businessId,
        action: 'create',
        resourceType: 'tax_filing',
        resourceId: result.reference,
        metadata: {
          year: filingData.year,
          type: 'annual',
          ipAddress: req.ip
        }
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Failed to file annual tax:', error);
      next(new ApiError(500, 'Failed to file annual tax return'));
    }
  }

  /**
   * Get business permits
   */
  async getBusinessPermits(req, res, next) {
    try {
      const { businessId } = req.params;

      const permits = await BusinessPermit.getByBusiness(businessId);

      res.json({
        success: true,
        data: permits
      });
    } catch (error) {
      logger.error('Failed to get permits:', error);
      next(new ApiError(500, 'Failed to get business permits'));
    }
  }

  /**
   * Renew business permit
   */
  async renewPermit(req, res, next) {
    try {
      const { businessId } = req.params;
      const { permitId, renewalData } = req.body;

      const permit = await BusinessPermit.findById(permitId);
      
      if (!permit) {
        return next(new ApiError(404, 'Permit not found'));
      }

      const result = await permit.renew(renewalData);

      // Log the renewal
      await AuditLog.log({
        userId: req.user.id,
        businessId,
        action: 'update',
        resourceType: 'permit',
        resourceId: permitId,
        metadata: {
          permitType: permit.type,
          ipAddress: req.ip
        }
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Failed to renew permit:', error);
      next(new ApiError(500, 'Failed to renew business permit'));
    }
  }

  /**
   * Get upcoming deadlines
   */
  async getUpcomingDeadlines(req, res, next) {
    try {
      const { businessId } = req.params;
      const { days = 30 } = req.query;

      const deadlines = await kenyaCompliance.getUpcomingDeadlines(businessId);

      // Filter by days
      const filteredDeadlines = deadlines.filter(d => d.daysUntil <= days);

      res.json({
        success: true,
        data: filteredDeadlines
      });
    } catch (error) {
      logger.error('Failed to get deadlines:', error);
      next(new ApiError(500, 'Failed to get upcoming deadlines'));
    }
  }

  /**
   * Get compliance history
   */
  async getComplianceHistory(req, res, next) {
    try {
      const { businessId } = req.params;
      const { limit = 12 } = req.query;

      const history = await ComplianceRecord.getHistory(businessId, limit);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Failed to get compliance history:', error);
      next(new ApiError(500, 'Failed to get compliance history'));
    }
  }

  /**
   * Get tax filing history
   */
  async getTaxHistory(req, res, next) {
    try {
      const { businessId } = req.params;
      const { type, limit = 12 } = req.query;

      const query = { businessId };
      if (type) query.type = type;

      const filings = await TaxFiling.find(query)
        .sort({ filingDate: -1 })
        .limit(limit)
        .lean();

      res.json({
        success: true,
        data: filings
      });
    } catch (error) {
      logger.error('Failed to get tax history:', error);
      next(new ApiError(500, 'Failed to get tax filing history'));
    }
  }

  /**
   * Calculate tax estimates
   */
  async calculateTax(req, res, next) {
    try {
      const { type, data } = req.body;

      let result;

      switch (type) {
        case 'vat':
          result = calculator.calculateVAT(data.sales, data.purchases, data.type);
          break;
        case 'income_tax':
          if (data.businessType === 'individual') {
            result = calculator.calculateIndividualIncomeTax(
              data.annualIncome,
              data.deductions
            );
          } else {
            result = calculator.calculateCorporateIncomeTax(
              data.profit,
              data.companyType
            );
          }
          break;
        case 'withholding':
          result = calculator.calculateWithholdingTax(
            data.amount,
            data.paymentType,
            data.isResident
          );
          break;
        case 'paye':
          result = calculator.calculatePAYE(data.grossPay, data.deductions);
          break;
        case 'turnover':
          result = calculator.calculateTurnoverTax(data.annualTurnover);
          break;
        default:
          return next(new ApiError(400, 'Invalid calculation type'));
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Tax calculation failed:', error);
      next(new ApiError(500, 'Failed to calculate tax'));
    }
  }

  /**
   * Get compliance alerts
   */
  async getAlerts(req, res, next) {
    try {
      const { businessId } = req.params;
      const { includeDismissed = false } = req.query;

      const latestRecord = await ComplianceRecord.getLatest(businessId);

      if (!latestRecord) {
        return res.json({
          success: true,
          data: []
        });
      }

      let alerts = latestRecord.alerts || [];
      
      if (!includeDismissed) {
        alerts = alerts.filter(a => !a.dismissed);
      }

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      logger.error('Failed to get alerts:', error);
      next(new ApiError(500, 'Failed to get compliance alerts'));
    }
  }

  /**
   * Dismiss compliance alert
   */
  async dismissAlert(req, res, next) {
    try {
      const { alertId } = req.params;

      // Find the compliance record containing this alert
      const record = await ComplianceRecord.findOne({
        'alerts._id': alertId
      });

      if (!record) {
        return next(new ApiError(404, 'Alert not found'));
      }

      await record.dismissAlert(alertId);

      res.json({
        success: true,
        message: 'Alert dismissed successfully'
      });
    } catch (error) {
      logger.error('Failed to dismiss alert:', error);
      next(new ApiError(500, 'Failed to dismiss alert'));
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(req, res, next) {
    try {
      const { businessId } = req.params;
      const { days = 30 } = req.query;

      const logs = await AuditLog.getDataAccessLogs(businessId, days);

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      logger.error('Failed to get audit logs:', error);
      next(new ApiError(500, 'Failed to get audit logs'));
    }
  }

  /**
   * Record user consent
   */
  async recordConsent(req, res, next) {
    try {
      const { purpose, granted } = req.body;

      await AuditLog.log({
        userId: req.user.id,
        action: granted ? 'consent_given' : 'consent_withdrawn',
        resourceType: 'user',
        resourceId: req.user.id,
        metadata: {
          purpose,
          granted,
          timestamp: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        message: `Consent ${granted ? 'recorded' : 'withdrawn'} successfully`
      });
    } catch (error) {
      logger.error('Failed to record consent:', error);
      next(new ApiError(500, 'Failed to record consent'));
    }
  }

  /**
   * Request data deletion
   */
  async requestDataDeletion(req, res, next) {
    try {
      const { reason } = req.body;

      await AuditLog.log({
        userId: req.user.id,
        action: 'data_deletion_request',
        resourceType: 'user',
        resourceId: req.user.id,
        metadata: {
          reason,
          requestedAt: new Date().toISOString()
        }
      });

      // Notify admin (implementation would depend on your notification system)
      // await notificationService.notifyAdmins('Data deletion request', { userId: req.user.id, reason });

      res.json({
        success: true,
        message: 'Data deletion request received. You will be contacted within 72 hours.'
      });
    } catch (error) {
      logger.error('Failed to request data deletion:', error);
      next(new ApiError(500, 'Failed to request data deletion'));
    }
  }
}

module.exports = new ComplianceController();