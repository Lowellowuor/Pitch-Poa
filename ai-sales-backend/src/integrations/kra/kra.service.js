/**
 * KRA Integration Service
 * Handles Kenya Revenue Authority API integration
 */

const crypto = require('crypto');
const config = require('./config/integrations.config');
const logger = require('../config/logger');
const { HttpClient, IntegrationError } = require('./utils/http-client');

class KRAService {
  constructor() {
    this.config = config.kra;
    this.client = new HttpClient(this.config.baseUrl, {
      'Authorization': `Bearer ${this.generateToken()}`,
      'X-Client-ID': this.config.clientId
    });
    
    logger.info('KRA service initialized');
  }

  /**
   * Generate authentication token
   */
  generateToken() {
    const timestamp = Date.now().toString();
    const signature = crypto
      .createHmac('sha256', this.config.clientSecret)
      .update(timestamp)
      .digest('hex');
    
    return Buffer.from(`${this.config.clientId}:${signature}:${timestamp}`).toString('base64');
  }

  /**
   * Register a new PIN
   * @param {Object} registrationData - PIN registration data
   */
  async registerPIN(registrationData) {
    try {
      const response = await this.client.post('/pin/register', {
        pin: registrationData.pin,
        businessName: registrationData.businessName,
        registrationNumber: registrationData.registrationNumber,
        businessType: registrationData.businessType,
        contactPerson: registrationData.contactPerson,
        phoneNumber: registrationData.phoneNumber,
        email: registrationData.email,
        physicalAddress: registrationData.physicalAddress,
        postalAddress: registrationData.postalAddress
      });

      logger.info(`PIN registered successfully: ${registrationData.pin}`);

      return {
        success: true,
        pin: response.pin,
        certificateUrl: response.certificateUrl,
        expiryDate: response.expiryDate
      };
    } catch (error) {
      logger.error('PIN registration failed:', error);
      throw new IntegrationError('PIN registration failed', 500, error.details);
    }
  }

  /**
   * Verify PIN validity
   * @param {string} pin - KRA PIN to verify
   */
  async verifyPIN(pin) {
    try {
      const response = await this.client.get(`/pin/verify/${pin}`);

      return {
        success: true,
        valid: response.valid,
        status: response.status,
        businessName: response.businessName,
        registeredDate: response.registeredDate
      };
    } catch (error) {
      if (error.statusCode === 404) {
        return {
          success: true,
          valid: false,
          message: 'PIN not found'
        };
      }
      
      logger.error('PIN verification failed:', error);
      throw new IntegrationError('PIN verification failed', 500);
    }
  }

  /**
   * File VAT return
   * @param {Object} vatData - VAT return data
   */
  async fileVATReturn(vatData) {
    try {
      // Validate VAT data
      this.validateVATData(vatData);

      const response = await this.client.post('/vat/file', {
        pin: vatData.pin,
        period: vatData.period,
        sales: vatData.sales,
        purchases: vatData.purchases,
        vatPayable: vatData.vatPayable,
        vatRecoverable: vatData.vatRecoverable,
        netVAT: vatData.netVAT,
        attachments: vatData.attachments
      });

      logger.info(`VAT return filed for period ${vatData.period}`);

      return {
        success: true,
        acknowledgementNumber: response.acknowledgementNumber,
        filingDate: response.filingDate,
        amountPaid: response.amountPaid
      };
    } catch (error) {
      logger.error('VAT filing failed:', error);
      throw new IntegrationError('VAT filing failed', 500, error.details);
    }
  }

  /**
   * Get tax compliance certificate
   * @param {string} pin - KRA PIN
   */
  async getComplianceCertificate(pin) {
    try {
      const response = await this.client.get(`/compliance/${pin}`);

      return {
        success: true,
        certificateNumber: response.certificateNumber,
        validUntil: response.validUntil,
        status: response.status,
        pdfUrl: response.pdfUrl
      };
    } catch (error) {
      logger.error('Failed to fetch compliance certificate:', error);
      throw new IntegrationError('Failed to fetch compliance certificate', 500);
    }
  }

  /**
   * File income tax return
   * @param {Object} incomeData - Income tax data
   */
  async fileIncomeTax(incomeData) {
    try {
      const response = await this.client.post('/income/file', {
        pin: incomeData.pin,
        yearOfIncome: incomeData.yearOfIncome,
        grossIncome: incomeData.grossIncome,
        allowableDeductions: incomeData.allowableDeductions,
        taxableIncome: incomeData.taxableIncome,
        taxPayable: incomeData.taxPayable,
        taxPaid: incomeData.taxPaid,
        balanceDue: incomeData.balanceDue
      });

      logger.info(`Income tax return filed for year ${incomeData.yearOfIncome}`);

      return {
        success: true,
        acknowledgementNumber: response.acknowledgementNumber,
        filingDate: response.filingDate
      };
    } catch (error) {
      logger.error('Income tax filing failed:', error);
      throw new IntegrationError('Income tax filing failed', 500, error.details);
    }
  }

  /**
   * Get tax obligations
   * @param {string} pin - KRA PIN
   */
  async getTaxObligations(pin) {
    try {
      const response = await this.client.get(`/obligations/${pin}`);

      return {
        success: true,
        obligations: response.obligations.map(ob => ({
          type: ob.taxType,
          period: ob.period,
          dueDate: ob.dueDate,
          status: ob.status,
          amount: ob.amount
        }))
      };
    } catch (error) {
      logger.error('Failed to fetch tax obligations:', error);
      throw new IntegrationError('Failed to fetch tax obligations', 500);
    }
  }

  /**
   * Make tax payment
   * @param {Object} paymentData - Payment details
   */
  async makeTaxPayment(paymentData) {
    try {
      const response = await this.client.post('/payment', {
        pin: paymentData.pin,
        taxType: paymentData.taxType,
        period: paymentData.period,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference
      });

      logger.info(`Tax payment of KES ${paymentData.amount} initiated`);

      return {
        success: true,
        paymentReceipt: response.receiptNumber,
        paymentDate: response.paymentDate,
        amountPaid: response.amountPaid
      };
    } catch (error) {
      logger.error('Tax payment failed:', error);
      throw new IntegrationError('Tax payment failed', 500, error.details);
    }
  }

  /**
   * Get payment history
   * @param {string} pin - KRA PIN
   * @param {Object} filters - Filter options
   */
  async getPaymentHistory(pin, filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await this.client.get(`/payments/${pin}?${queryParams}`);

      return {
        success: true,
        payments: response.payments.map(p => ({
          date: p.paymentDate,
          type: p.taxType,
          amount: p.amount,
          receiptNumber: p.receiptNumber,
          status: p.status
        })),
        totalPaid: response.totalPaid,
        period: response.period
      };
    } catch (error) {
      logger.error('Failed to fetch payment history:', error);
      throw new IntegrationError('Failed to fetch payment history', 500);
    }
  }

  validateVATData(data) {
    const required = ['pin', 'period', 'sales', 'purchases'];
    
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (data.sales < 0 || data.purchases < 0) {
      throw new Error('Sales and purchases must be non-negative');
    }

    return true;
  }
}

module.exports = new KRAService();