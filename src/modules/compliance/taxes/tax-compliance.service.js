/**
 * Tax Compliance Service
 * Extends KRA integration with comprehensive tax compliance features
 */

const logger = require('../config/logger');
const config = require('../config/compliance.config');
const kraService = require('../integrations/kra.service');
const TaxCalculator = require('./calculators/tax-calculator');
const { ComplianceError } = require('./utils/errors');
const mongoose = require('mongoose');
const TaxFiling = mongoose.model('TaxFiling');

class TaxComplianceService {
  constructor() {
    this.taxRates = config.tax;
    this.deadlines = config.deadlines;
    this.calculator = new TaxCalculator();
    
    logger.info('Tax Compliance Service initialized');
  }

  /**
   * Check tax compliance status for a business
   * @param {string} businessId - Business ID
   * @param {Object} businessData - Business data
   */
  async checkTaxCompliance(businessId, businessData) {
    try {
      logger.info(`Checking tax compliance for business: ${businessId}`);

      const [
        pinValidity,
        vatStatus,
        incomeTaxStatus,
        withholdingStatus,
        filingHistory
      ] = await Promise.all([
        this.checkPINValidity(businessData.kraPin),
        this.checkVATCompliance(businessId, businessData),
        this.checkIncomeTaxCompliance(businessId, businessData),
        this.checkWithholdingTaxCompliance(businessId, businessData),
        this.getFilingHistory(businessId)
      ]);

      // Calculate compliance score
      const score = this.calculateTaxComplianceScore({
        pinValidity,
        vatStatus,
        incomeTaxStatus,
        withholdingStatus,
        filingHistory
      });

      // Identify issues
      const issues = this.identifyTaxIssues({
        pinValidity,
        vatStatus,
        incomeTaxStatus,
        withholdingStatus,
        filingHistory
      });

      // Get upcoming deadlines
      const upcomingDeadlines = await this.getUpcomingDeadlines(businessId);

      return {
        score,
        status: score >= 80 ? 'compliant' : 'non-compliant',
        pinValidity,
        vatStatus,
        incomeTaxStatus,
        withholdingStatus,
        filingHistory: filingHistory.slice(0, 6), // Last 6 filings
        upcomingDeadlines,
        issues,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Tax compliance check failed:', error);
      throw new ComplianceError('Failed to check tax compliance', error);
    }
  }

  /**
   * Check KRA PIN validity
   * @param {string} pin - KRA PIN
   */
  async checkPINValidity(pin) {
    try {
      const result = await kraService.verifyPIN(pin);
      
      return {
        valid: result.valid,
        status: result.status,
        businessName: result.businessName,
        registeredDate: result.registeredDate,
        expiryDate: result.expiryDate
      };
    } catch (error) {
      logger.error('PIN validity check failed:', error);
      return {
        valid: false,
        error: 'Failed to verify PIN'
      };
    }
  }

  /**
   * Check VAT compliance
   * @param {string} businessId - Business ID
   * @param {Object} businessData - Business data
   */
  async checkVATCompliance(businessId, businessData) {
    try {
      const filings = await TaxFiling.find({
        businessId,
        type: 'vat',
        filingDate: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
        }
      }).sort({ period: -1 });

      const annualTurnover = businessData.annualTurnover || 0;
      const vatRegistered = annualTurnover >= config.tax.vat.registrationThreshold;
      
      if (!vatRegistered) {
        return {
          registered: false,
          required: false,
          status: 'exempt',
          message: 'Below VAT registration threshold'
        };
      }

      // Check for missing filings
      const expectedFilings = 12; // Monthly filings
      const missingFilings = expectedFilings - filings.length;
      
      // Check for late filings
      const lateFilings = filings.filter(f => 
        new Date(f.filingDate) > new Date(f.dueDate)
      ).length;

      // Calculate VAT liability
      const vatLiability = await this.calculator.calculateVATLiability(
        businessData.sales,
        businessData.purchases
      );

      return {
        registered: true,
        required: true,
        vatNumber: businessData.vatNumber,
        filingFrequency: config.tax.vat.filingFrequency,
        filingsMade: filings.length,
        missingFilings,
        lateFilings,
        complianceRate: Math.round((filings.length / expectedFilings) * 100),
        currentLiability: vatLiability,
        lastFilingDate: filings[0]?.filingDate,
        nextDueDate: this.calculateNextDueDate('vat')
      };
    } catch (error) {
      logger.error('VAT compliance check failed:', error);
      return {
        registered: false,
        required: true,
        error: 'Failed to check VAT compliance'
      };
    }
  }

  /**
   * Check Income Tax compliance
   * @param {string} businessId - Business ID
   * @param {Object} businessData - Business data
   */
  async checkIncomeTaxCompliance(businessId, businessData) {
    try {
      const filings = await TaxFiling.find({
        businessId,
        type: 'income_tax',
        filingDate: {
          $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 2))
        }
      }).sort({ year: -1 });

      const installments = await TaxFiling.find({
        businessId,
        type: 'income_tax_installment',
        filingDate: {
          $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
        }
      });

      // Calculate estimated tax
      const estimatedTax = await this.calculator.calculateIncomeTax(
        businessData.profit || 0,
        businessData.businessType
      );

      // Check installment payments
      const expectedInstallments = 4; // Quarterly installments
      const paidInstallments = installments.length;
      
      return {
        registered: true,
        lastAnnualFiling: filings[0]?.filingDate,
        lastAnnualPeriod: filings[0]?.year,
        installmentsPaid: paidInstallments,
        installmentsRequired: expectedInstallments,
        installmentCompliance: Math.round((paidInstallments / expectedInstallments) * 100),
        estimatedTaxLiability: estimatedTax,
        taxPaidToDate: installments.reduce((sum, i) => sum + (i.amount || 0), 0),
        balanceDue: estimatedTax - installments.reduce((sum, i) => sum + (i.amount || 0), 0),
        nextInstallmentDue: this.calculateNextInstallmentDue()
      };
    } catch (error) {
      logger.error('Income tax compliance check failed:', error);
      return {
        registered: true,
        error: 'Failed to check income tax compliance'
      };
    }
  }

  /**
   * Check Withholding Tax compliance
   * @param {string} businessId - Business ID
   * @param {Object} businessData - Business data
   */
  async checkWithholdingTaxCompliance(businessId, businessData) {
    try {
      const filings = await TaxFiling.find({
        businessId,
        type: 'withholding_tax',
        filingDate: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
        }
      });

      // Calculate withholding tax due
      const withholdingDue = await this.calculator.calculateWithholdingTax(
        businessData.payments || []
      );

      return {
        required: businessData.hasWithholdingObligations || false,
        filingsMade: filings.length,
        totalWithheld: filings.reduce((sum, f) => sum + (f.amount || 0), 0),
        estimatedDue: withholdingDue,
        lastFilingDate: filings[0]?.filingDate,
        nextDueDate: this.calculateNextDueDate('withholding'),
        complianceStatus: filings.length >= 6 ? 'good' : 'needs_attention'
      };
    } catch (error) {
      logger.error('Withholding tax compliance check failed:', error);
      return {
        required: false,
        error: 'Failed to check withholding tax compliance'
      };
    }
  }

  /**
   * Get filing history
   * @param {string} businessId - Business ID
   */
  async getFilingHistory(businessId) {
    try {
      return await TaxFiling.find({ businessId })
        .sort({ filingDate: -1 })
        .limit(12)
        .lean();
    } catch (error) {
      logger.error('Failed to get filing history:', error);
      return [];
    }
  }

  /**
   * File monthly tax return
   * @param {string} businessId - Business ID
   * @param {Object} data - Filing data
   */
  async fileMonthlyReturn(businessId, data) {
    try {
      logger.info(`Filing monthly return for business ${businessId}`);

      // Validate filing data
      this.validateFilingData(data, 'monthly');

      // Calculate taxes
      const vatAmount = await this.calculator.calculateVAT(
        data.sales,
        data.purchases
      );

      const withholdingAmount = await this.calculator.calculateWithholdingTax(
        data.payments || []
      );

      // Submit to KRA
      const kraResponse = await kraService.fileVATReturn({
        pin: data.kraPin,
        period: data.period,
        sales: data.sales,
        purchases: data.purchases,
        vatPayable: vatAmount,
        attachments: data.attachments
      });

      // Save filing record
      const filing = new TaxFiling({
        businessId,
        type: 'vat',
        period: data.period,
        filingDate: new Date(),
        dueDate: new Date(data.dueDate),
        amount: vatAmount,
        status: 'filed',
        kraReference: kraResponse.acknowledgementNumber,
        metadata: {
          sales: data.sales,
          purchases: data.purchases,
          vatAmount,
          withholdingAmount
        }
      });

      await filing.save();

      logger.info(`Monthly return filed successfully for ${businessId}`, {
        reference: kraResponse.acknowledgementNumber
      });

      return {
        success: true,
        reference: kraResponse.acknowledgementNumber,
        filingDate: new Date().toISOString(),
        amount: vatAmount,
        nextDueDate: this.calculateNextDueDate('vat')
      };
    } catch (error) {
      logger.error('Failed to file monthly return:', error);
      throw new ComplianceError('Failed to file monthly return', error);
    }
  }

  /**
   * File annual tax return
   * @param {string} businessId - Business ID
   * @param {Object} data - Filing data
   */
  async fileAnnualReturn(businessId, data) {
    try {
      logger.info(`Filing annual return for business ${businessId}`);

      // Validate filing data
      this.validateFilingData(data, 'annual');

      // Calculate income tax
      const incomeTax = await this.calculator.calculateIncomeTax(
        data.taxableIncome,
        data.businessType
      );

      // Calculate installments paid
      const installmentsPaid = await TaxFiling.aggregate([
        {
          $match: {
            businessId: mongoose.Types.ObjectId(businessId),
            type: 'income_tax_installment',
            year: data.year
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const paidAmount = installmentsPaid[0]?.total || 0;
      const balanceDue = incomeTax - paidAmount;

      // Submit to KRA
      const kraResponse = await kraService.fileIncomeTax({
        pin: data.kraPin,
        yearOfIncome: data.year,
        grossIncome: data.grossIncome,
        allowableDeductions: data.deductions,
        taxableIncome: data.taxableIncome,
        taxPayable: incomeTax,
        taxPaid: paidAmount,
        balanceDue
      });

      // Save filing record
      const filing = new TaxFiling({
        businessId,
        type: 'income_tax',
        year: data.year,
        filingDate: new Date(),
        dueDate: new Date(data.dueDate),
        amount: incomeTax,
        paidAmount,
        balanceDue,
        status: balanceDue > 0 ? 'filed_with_balance' : 'filed',
        kraReference: kraResponse.acknowledgementNumber,
        metadata: data
      });

      await filing.save();

      logger.info(`Annual return filed successfully for ${businessId}`, {
        reference: kraResponse.acknowledgementNumber,
        balanceDue
      });

      return {
        success: true,
        reference: kraResponse.acknowledgementNumber,
        filingDate: new Date().toISOString(),
        totalTax: incomeTax,
        paidAmount,
        balanceDue,
        paymentDeadline: balanceDue > 0 ? '30 days from filing' : null
      };
    } catch (error) {
      logger.error('Failed to file annual return:', error);
      throw new ComplianceError('Failed to file annual return', error);
    }
  }

  /**
   * Get upcoming tax deadlines
   * @param {string} businessId - Business ID
   */
  async getUpcomingDeadlines(businessId) {
    try {
      const deadlines = [];
      const now = new Date();

      // VAT deadline
      deadlines.push({
        type: 'vat',
        description: 'Monthly VAT Return',
        deadline: this.calculateNextDueDate('vat'),
        daysUntil: this.calculateDaysUntil(this.calculateNextDueDate('vat')),
        penalty: config.tax.vat.lateFilingPenalty
      });

      // Income tax installment deadlines
      const nextInstallment = this.calculateNextInstallmentDue();
      if (nextInstallment) {
        deadlines.push({
          type: 'income_tax_installment',
          description: `Income Tax Installment - Quarter ${nextInstallment.quarter}`,
          deadline: nextInstallment.date,
          daysUntil: this.calculateDaysUntil(nextInstallment.date),
          amount: nextInstallment.amount
        });
      }

      // Withholding tax deadline
      deadlines.push({
        type: 'withholding',
        description: 'Monthly Withholding Tax',
        deadline: this.calculateNextDueDate('withholding'),
        daysUntil: this.calculateDaysUntil(this.calculateNextDueDate('withholding'))
      });

      return deadlines
        .filter(d => d.daysUntil >= 0)
        .sort((a, b) => a.daysUntil - b.daysUntil);
    } catch (error) {
      logger.error('Failed to get upcoming deadlines:', error);
      return [];
    }
  }

  /**
   * Calculate tax compliance score
   * @param {Object} status - Compliance status
   */
  calculateTaxComplianceScore(status) {
    let score = 100;

    // Deduct for PIN issues
    if (!status.pinValidity.valid) score -= 30;

    // Deduct for missing VAT filings
    if (status.vatStatus.missingFilings) {
      score -= status.vatStatus.missingFilings * 5;
    }

    // Deduct for late filings
    if (status.vatStatus.lateFilings) {
      score -= status.vatStatus.lateFilings * 3;
    }

    // Deduct for missing income tax installments
    const installmentShortfall = status.incomeTaxStatus.installmentsRequired - 
                                 status.incomeTaxStatus.installmentsPaid;
    if (installmentShortfall > 0) {
      score -= installmentShortfall * 10;
    }

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Identify tax compliance issues
   * @param {Object} status - Compliance status
   */
  identifyTaxIssues(status) {
    const issues = [];

    if (!status.pinValidity.valid) {
      issues.push({
        type: 'critical',
        code: 'PIN_INVALID',
        message: 'KRA PIN is invalid or expired',
        action: 'Renew or verify KRA PIN immediately'
      });
    }

    if (status.vatStatus.missingFilings > 0) {
      issues.push({
        type: 'high',
        code: 'MISSING_VAT_FILINGS',
        message: `${status.vatStatus.missingFilings} missing VAT filings`,
        action: 'File pending VAT returns'
      });
    }

    if (status.vatStatus.lateFilings > 0) {
      issues.push({
        type: 'medium',
        code: 'LATE_VAT_FILINGS',
        message: `${status.vatStatus.lateFilings} late VAT filings`,
        action: 'Ensure future filings are on time to avoid penalties'
      });
    }

    const installmentShortfall = status.incomeTaxStatus.installmentsRequired - 
                                 status.incomeTaxStatus.installmentsPaid;
    if (installmentShortfall > 0) {
      issues.push({
        type: 'high',
        code: 'MISSING_INSTALLMENTS',
        message: `${installmentShortfall} missing income tax installments`,
        action: 'Pay outstanding installments immediately'
      });
    }

    if (status.incomeTaxStatus.balanceDue > 0) {
      issues.push({
        type: 'medium',
        code: 'TAX_BALANCE_DUE',
        message: `Tax balance due: KES ${status.incomeTaxStatus.balanceDue.toLocaleString()}`,
        action: 'Settle outstanding tax balance'
      });
    }

    return issues;
  }

  /**
   * Validate filing data
   * @param {Object} data - Filing data
   * @param {string} type - Filing type
   */
  validateFilingData(data, type) {
    const required = type === 'monthly' 
      ? ['kraPin', 'period', 'sales', 'purchases']
      : ['kraPin', 'year', 'grossIncome', 'taxableIncome'];

    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (type === 'monthly') {
      if (data.sales < 0 || data.purchases < 0) {
        throw new Error('Sales and purchases must be non-negative');
      }
    }

    return true;
  }

  /**
   * Calculate next due date for filing type
   * @param {string} type - Filing type
   */
  calculateNextDueDate(type) {
    const now = new Date();
    let dueDate = new Date(now);

    switch (type) {
      case 'vat':
        // 20th of next month
        dueDate.setMonth(now.getMonth() + 1);
        dueDate.setDate(20);
        break;
      case 'withholding':
        // 20th of next month
        dueDate.setMonth(now.getMonth() + 1);
        dueDate.setDate(20);
        break;
      default:
        dueDate.setMonth(now.getMonth() + 1);
        dueDate.setDate(20);
    }

    return dueDate.toISOString().split('T')[0];
  }

  /**
   * Calculate next installment due date
   */
  calculateNextInstallmentDue() {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const installmentMonths = [3, 6, 9, 12]; // April, July, October, January

    for (const month of installmentMonths) {
      const installmentDate = new Date(now.getFullYear(), month - 1, 20);
      if (installmentDate > now) {
        return {
          quarter: installmentMonths.indexOf(month) + 1,
          date: installmentDate.toISOString().split('T')[0],
          amount: null // Would calculate based on previous year's tax
        };
      }
    }

    // If all passed, next year's first installment
    return {
      quarter: 1,
      date: new Date(now.getFullYear() + 1, 2, 20).toISOString().split('T')[0],
      amount: null
    };
  }

  /**
   * Calculate days until deadline
   * @param {string} dateString - Deadline date
   */
  calculateDaysUntil(dateString) {
    const days = Math.ceil(
      (new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return days;
  }
}

module.exports = TaxComplianceService;