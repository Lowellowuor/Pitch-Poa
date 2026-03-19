/**
 * Kenya Compliance Service
 * Main orchestrator for all compliance checks and reporting
 */

const logger = require('../config/logger');
const config = require('../config/compliance.config');
const TaxComplianceService = require('./tax-compliance.service');
const BusinessRegistrationService = require('./business-registration.service');
const SocialComplianceService = require('./social-compliance.service');
const DataProtectionService = require('./data-protection.service');
const ConsumerProtectionService = require('./consumer-protection.service');
const { ComplianceError } = require('./utils/errors');

class KenyaComplianceService {
  constructor() {
    this.taxService = new TaxComplianceService();
    this.businessService = new BusinessRegistrationService();
    this.socialService = new SocialComplianceService();
    this.dataService = new DataProtectionService();
    this.consumerService = new ConsumerProtectionService();
    
    this.complianceLevels = config.complianceLevels;
    this.alerts = config.alerts;
    
    logger.info('Kenya Compliance Service initialized');
  }

  /**
   * Perform comprehensive compliance check for a business
   * @param {string} businessId - Business ID
   * @param {Object} businessData - Business data
   */
  async performFullComplianceCheck(businessId, businessData) {
    try {
      logger.info(`Starting full compliance check for business: ${businessId}`);

      // Run all compliance checks in parallel
      const [
        taxStatus,
        registrationStatus,
        socialStatus,
        dataProtectionStatus,
        consumerStatus
      ] = await Promise.all([
        this.taxService.checkTaxCompliance(businessId, businessData),
        this.businessService.checkRegistrationStatus(businessId, businessData),
        this.socialService.checkSocialCompliance(businessId, businessData),
        this.dataService.checkDataProtectionCompliance(businessId, businessData),
        this.consumerService.checkConsumerCompliance(businessId, businessData)
      ]);

      // Calculate overall compliance score
      const overallScore = this.calculateOverallScore({
        taxStatus,
        registrationStatus,
        socialStatus,
        dataProtectionStatus,
        consumerStatus
      });

      // Determine compliance level
      const complianceLevel = this.determineComplianceLevel(overallScore);

      // Generate actionable insights
      const insights = this.generateInsights({
        taxStatus,
        registrationStatus,
        socialStatus,
        dataProtectionStatus,
        consumerStatus
      });

      // Check for deadlines and generate alerts
      const alerts = await this.generateAlerts(businessId, businessData);

      const complianceReport = {
        businessId,
        timestamp: new Date().toISOString(),
        overallScore,
        complianceLevel,
        checks: {
          tax: taxStatus,
          registration: registrationStatus,
          social: socialStatus,
          dataProtection: dataProtectionStatus,
          consumer: consumerStatus
        },
        insights,
        alerts,
        recommendations: this.generateRecommendations(insights),
        nextReviewDate: this.calculateNextReviewDate()
      };

      logger.info(`Compliance check completed for business ${businessId}`, {
        overallScore,
        complianceLevel
      });

      return complianceReport;
    } catch (error) {
      logger.error('Full compliance check failed:', error);
      throw new ComplianceError('Failed to perform full compliance check', error);
    }
  }

  /**
   * Get compliance summary dashboard
   * @param {string} businessId - Business ID
   */
  async getComplianceDashboard(businessId) {
    try {
      const [
        upcomingDeadlines,
        pendingFilings,
        expiringPermits,
        recentViolations,
        complianceTrend
      ] = await Promise.all([
        this.getUpcomingDeadlines(businessId),
        this.getPendingFilings(businessId),
        this.getExpiringPermits(businessId),
        this.getRecentViolations(businessId),
        this.getComplianceTrend(businessId)
      ]);

      return {
        businessId,
        timestamp: new Date().toISOString(),
        summary: {
          upcomingDeadlines,
          pendingFilings,
          expiringPermits,
          recentViolations,
          complianceTrend
        },
        healthScore: await this.calculateHealthScore(businessId),
        riskLevel: await this.assessRiskLevel(businessId)
      };
    } catch (error) {
      logger.error('Failed to get compliance dashboard:', error);
      throw new ComplianceError('Failed to get compliance dashboard', error);
    }
  }

  /**
   * Get upcoming compliance deadlines
   * @param {string} businessId - Business ID
   */
  async getUpcomingDeadlines(businessId) {
    const deadlines = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.setDate(now.getDate() + 30));

    // Tax deadlines
    const taxDeadlines = await this.taxService.getUpcomingDeadlines(businessId);
    deadlines.push(...taxDeadlines);

    // Permit renewals
    const permitDeadlines = await this.businessService.getUpcomingRenewals(businessId);
    deadlines.push(...permitDeadlines);

    // Social contributions
    const socialDeadlines = await this.socialService.getUpcomingDeadlines(businessId);
    deadlines.push(...socialDeadlines);

    // Filter and sort deadlines
    return deadlines
      .filter(d => new Date(d.deadline) <= thirtyDaysFromNow)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  /**
   * File compliance report with relevant authorities
   * @param {string} businessId - Business ID
   * @param {string} reportType - Type of report
   * @param {Object} data - Report data
   */
  async fileComplianceReport(businessId, reportType, data) {
    try {
      logger.info(`Filing ${reportType} report for business ${businessId}`);

      let result;
      
      switch (reportType) {
        case 'tax_monthly':
          result = await this.taxService.fileMonthlyReturn(businessId, data);
          break;
        case 'tax_annual':
          result = await this.taxService.fileAnnualReturn(businessId, data);
          break;
        case 'business_permit':
          result = await this.businessService.renewPermit(businessId, data);
          break;
        case 'social_contributions':
          result = await this.socialService.fileContributions(businessId, data);
          break;
        case 'data_protection':
          result = await this.dataService.fileComplianceReport(businessId, data);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      // Log the filing
      await this.logComplianceAction(businessId, 'file_report', {
        reportType,
        result,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        reportType,
        filingDate: new Date().toISOString(),
        reference: result.reference,
        nextDueDate: result.nextDueDate
      };
    } catch (error) {
      logger.error('Failed to file compliance report:', error);
      throw new ComplianceError('Failed to file compliance report', error);
    }
  }

  /**
   * Calculate overall compliance score
   * @param {Object} statuses - Individual compliance statuses
   */
  calculateOverallScore(statuses) {
    const weights = {
      taxStatus: 0.35,
      registrationStatus: 0.25,
      socialStatus: 0.20,
      dataProtectionStatus: 0.10,
      consumerStatus: 0.10
    };

    let totalScore = 0;
    
    for (const [key, weight] of Object.entries(weights)) {
      if (statuses[key] && statuses[key].score) {
        totalScore += statuses[key].score * weight;
      }
    }

    return Math.round(totalScore * 100) / 100;
  }

  /**
   * Determine compliance level based on score
   * @param {number} score - Compliance score
   */
  determineComplianceLevel(score) {
    for (const [level, range] of Object.entries(this.complianceLevels)) {
      if (score >= range.min && score <= range.max) {
        return level;
      }
    }
    return 'poor';
  }

  /**
   * Generate insights from compliance checks
   * @param {Object} statuses - Compliance statuses
   */
  generateInsights(statuses) {
    const insights = [];

    // Tax insights
    if (statuses.taxStatus.score < 70) {
      insights.push({
        area: 'tax',
        severity: 'high',
        message: 'Tax compliance needs immediate attention',
        details: statuses.taxStatus.issues
      });
    }

    // Registration insights
    if (statuses.registrationStatus.expiringPermits?.length > 0) {
      insights.push({
        area: 'registration',
        severity: 'medium',
        message: `${statuses.registrationStatus.expiringPermits.length} permits expiring soon`,
        details: statuses.registrationStatus.expiringPermits
      });
    }

    // Social compliance insights
    if (statuses.socialStatus.missedPayments?.length > 0) {
      insights.push({
        area: 'social',
        severity: 'high',
        message: 'Missed social security contributions detected',
        details: statuses.socialStatus.missedPayments
      });
    }

    // Data protection insights
    if (statuses.dataProtectionStatus.violations?.length > 0) {
      insights.push({
        area: 'data_protection',
        severity: 'critical',
        message: 'Data protection violations found',
        details: statuses.dataProtectionStatus.violations
      });
    }

    return insights;
  }

  /**
   * Generate alerts for upcoming deadlines
   * @param {string} businessId - Business ID
   * @param {Object} businessData - Business data
   */
  async generateAlerts(businessId, businessData) {
    const alerts = [];
    const deadlines = await this.getUpcomingDeadlines(businessId);

    for (const deadline of deadlines) {
      const daysUntil = Math.ceil(
        (new Date(deadline.deadline) - new Date()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil <= this.alerts.daysBeforeDeadline) {
        alerts.push({
          type: deadline.type,
          severity: daysUntil <= 7 ? 'critical' : 'warning',
          message: `${deadline.description} due in ${daysUntil} days`,
          deadline: deadline.deadline,
          daysRemaining: daysUntil
        });
      }
    }

    return alerts;
  }

  /**
   * Generate recommendations based on insights
   * @param {Array} insights - Compliance insights
   */
  generateRecommendations(insights) {
    const recommendations = [];

    for (const insight of insights) {
      switch (insight.area) {
        case 'tax':
          recommendations.push({
            priority: 'high',
            action: 'File pending tax returns immediately',
            timeline: 'immediate',
            resources: ['KRA Portal', 'Tax Consultant']
          });
          break;
        case 'registration':
          recommendations.push({
            priority: 'medium',
            action: 'Renew expiring business permits',
            timeline: 'within 30 days',
            resources: ['e-Citizen', 'County Government Portal']
          });
          break;
        case 'social':
          recommendations.push({
            priority: 'high',
            action: 'Clear missed social contributions',
            timeline: 'within 14 days',
            resources: ['SHIF Portal', 'NSSF Portal']
          });
          break;
        case 'data_protection':
          recommendations.push({
            priority: 'critical',
            action: 'Address data protection violations',
            timeline: 'immediate',
            resources: ['Data Protection Officer', 'Legal Counsel']
          });
          break;
      }
    }

    return recommendations;
  }

  /**
   * Calculate next review date
   */
  calculateNextReviewDate() {
    const nextReview = new Date();
    nextReview.setMonth(nextReview.getMonth() + 1);
    return nextReview.toISOString().split('T')[0];
  }

  /**
   * Log compliance actions for audit trail
   * @param {string} businessId - Business ID
   * @param {string} action - Action performed
   * @param {Object} details - Action details
   */
  async logComplianceAction(businessId, action, details) {
    // This would integrate with your AuditLog model
    logger.info(`Compliance action logged: ${action} for business ${businessId}`, details);
  }

  /**
   * Calculate business health score
   * @param {string} businessId - Business ID
   */
  async calculateHealthScore(businessId) {
    // Implementation would pull from various metrics
    return {
      overall: 85,
      financial: 90,
      compliance: 80,
      operational: 85
    };
  }

  /**
   * Assess business risk level
   * @param {string} businessId - Business ID
   */
  async assessRiskLevel(businessId) {
    // Implementation would analyze various risk factors
    return {
      level: 'low',
      factors: [],
      recommendations: []
    };
  }

  /**
   * Get pending filings
   * @param {string} businessId - Business ID
   */
  async getPendingFilings(businessId) {
    // Implementation would query database
    return [];
  }

  /**
   * Get expiring permits
   * @param {string} businessId - Business ID
   */
  async getExpiringPermits(businessId) {
    // Implementation would query database
    return [];
  }

  /**
   * Get recent violations
   * @param {string} businessId - Business ID
   */
  async getRecentViolations(businessId) {
    // Implementation would query database
    return [];
  }

  /**
   * Get compliance trend
   * @param {string} businessId - Business ID
   */
  async getComplianceTrend(businessId) {
    // Implementation would analyze historical data
    return {
      trend: 'improving',
      data: []
    };
  }
}

module.exports = KenyaComplianceService;