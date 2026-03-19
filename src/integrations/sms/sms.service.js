/**
 * SMS Service
 * Handles SMS communications using Africa's Talking
 */

const africastalking = require('africastalking');
const config = require('./config/integrations.config');
const logger = require('../config/logger');
const { IntegrationError } = require('./utils/http-client');

class SMSService {
  constructor() {
    this.provider = config.sms.provider;
    
    if (this.provider === 'africastalking') {
      this.client = africastalking({
        username: config.sms.username,
        apiKey: config.sms.apiKey
      }).SMS;
    }
    
    logger.info(`SMS service initialized with provider: ${this.provider}`);
  }

  /**
   * Send a single SMS
   * @param {Object} options - SMS options
   * @param {string} options.to - Recipient phone number
   * @param {string} options.message - SMS content
   * @param {string} options.senderId - Custom sender ID
   */
  async sendSMS({ to, message, senderId = config.sms.senderId }) {
    try {
      this.validateSMSInput({ to, message });

      const formattedNumber = this.formatPhoneNumber(to);
      
      const response = await this.client.send({
        to: formattedNumber,
        message,
        from: senderId,
        enqueue: true
      });

      logger.info(`SMS sent successfully to ${formattedNumber}`, {
        messageId: response.SMSMessageData?.Recipients[0]?.messageId
      });

      return {
        success: true,
        messageId: response.SMSMessageData?.Recipients[0]?.messageId,
        cost: response.SMSMessageData?.Recipients[0]?.cost,
        to: formattedNumber
      };
    } catch (error) {
      logger.error('Failed to send SMS:', {
        to,
        message: message.substring(0, 50),
        error: error.message
      });

      throw new IntegrationError(
        'SMS delivery failed',
        500,
        error.response?.data
      );
    }
  }

  /**
   * Send bulk SMS messages
   * @param {Array} messages - Array of SMS options
   */
  async sendBulkSMS(messages) {
    try {
      const validMessages = messages.filter(msg => 
        this.validateSMSInput(msg, false)
      );

      const recipients = validMessages.map(msg => ({
        to: this.formatPhoneNumber(msg.to),
        message: msg.message
      }));

      const response = await this.client.sendBulk({
        to: recipients.map(r => r.to),
        message: 'Bulk message', // Will be overridden per recipient
        from: config.sms.senderId,
        enqueue: true
      });

      logger.info(`Bulk SMS sent: ${recipients.length} successful`);

      return {
        success: true,
        sent: recipients.length,
        failed: messages.length - validMessages.length,
        recipients: response.SMSMessageData?.Recipients
      };
    } catch (error) {
      logger.error('Bulk SMS sending failed:', error);
      throw new IntegrationError('Bulk SMS delivery failed', 500);
    }
  }

  /**
   * Send verification code
   * @param {string} phoneNumber - User's phone number
   * @param {string} code - Verification code
   */
  async sendVerificationCode(phoneNumber, code) {
    const message = `Your Pitch Poa verification code is: ${code}. Valid for 10 minutes.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      senderId: 'PitchPoa'
    });
  }

  /**
   * Send order confirmation
   * @param {Object} order - Order information
   */
  async sendOrderConfirmation(order) {
    const message = `Pitch Poa: Order #${order.orderNumber} confirmed! Total: KES ${order.total}. Track your order: ${process.env.APP_URL}/orders/${order.orderNumber}`;
    
    return this.sendSMS({
      to: order.customerPhone,
      message,
      senderId: 'PitchPoa'
    });
  }

  /**
   * Send marketing message
   * @param {string} phoneNumber - Customer's phone number
   * @param {string} campaign - Campaign name
   * @param {string} message - Marketing message
   */
  async sendMarketingSMS(phoneNumber, campaign, message) {
    const optOutMessage = `${message} Reply STOP to opt out.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message: optOutMessage,
      senderId: 'PitchPoa'
    });
  }

  /**
   * Check SMS balance
   */
  async checkBalance() {
    try {
      const response = await this.client.fetchBalance();
      
      logger.info('SMS balance fetched:', response);

      return {
        success: true,
        balance: response.balance
      };
    } catch (error) {
      logger.error('Failed to fetch SMS balance:', error);
      throw new IntegrationError('Failed to fetch SMS balance', 500);
    }
  }

  /**
   * Handle SMS delivery report
   * @param {Object} report - Delivery report from provider
   */
  async handleDeliveryReport(report) {
    logger.info('SMS delivery report received:', report);
    
    // Update database with delivery status
    // This would integrate with your database service
    
    return {
      success: true,
      processed: true
    };
  }

  validateSMSInput(input, throwError = true) {
    const { to, message } = input;
    
    if (!to) {
      if (throwError) throw new Error('Recipient phone number is required');
      return false;
    }

    if (!message || message.trim().length === 0) {
      if (throwError) throw new Error('SMS message cannot be empty');
      return false;
    }

    if (message.length > 1600) {
      if (throwError) throw new Error('SMS message exceeds 1600 characters');
      return false;
    }

    return true;
  }

  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Kenyan numbers
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    }
    
    // Ensure it has country code
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  }
}

module.exports = new SMSService();