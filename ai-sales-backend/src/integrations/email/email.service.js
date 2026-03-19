/**
 * Email Service
 * Handles all email communications using SendGrid
 */

const sgMail = require('@sendgrid/mail');
const config = require('./config/integrations.config');
const logger = require('../config/logger');
const { IntegrationError } = require('./utils/http-client');

class EmailService {
  constructor() {
    this.provider = config.email.provider;
    this.from = {
      email: config.email.fromEmail,
      name: config.email.fromName
    };
    
    if (this.provider === 'sendgrid') {
      sgMail.setApiKey(config.email.apiKey);
    }
    
    logger.info(`Email service initialized with provider: ${this.provider}`);
  }

  /**
   * Send a single email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text content
   * @param {string} options.html - HTML content
   * @param {string} options.templateId - SendGrid template ID
   * @param {Object} options.dynamicData - Template dynamic data
   */
  async sendEmail({ to, subject, text, html, templateId, dynamicData = {} }) {
    try {
      this.validateEmailInput({ to, subject, text, html, templateId });

      const msg = {
        to,
        from: this.from,
        subject,
        text,
        html,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      };

      if (templateId) {
        msg.templateId = templateId;
        msg.dynamicTemplateData = dynamicData;
        delete msg.subject;
        delete msg.text;
        delete msg.html;
      }

      const response = await sgMail.send(msg);
      
      logger.info(`Email sent successfully to ${to}`, {
        messageId: response[0]?.headers['x-message-id']
      });

      return {
        success: true,
        messageId: response[0]?.headers['x-message-id'],
        to
      };
    } catch (error) {
      logger.error('Failed to send email:', {
        to,
        subject,
        error: error.message,
        response: error.response?.body
      });

      throw new IntegrationError(
        'Email delivery failed',
        500,
        error.response?.body?.errors
      );
    }
  }

  /**
   * Send bulk emails
   * @param {Array} emails - Array of email options
   */
  async sendBulkEmails(emails) {
    try {
      const validEmails = emails.filter(email => 
        this.validateEmailInput(email, false)
      );

      const messages = validEmails.map(email => ({
        to: email.to,
        from: this.from,
        subject: email.subject,
        templateId: email.templateId,
        dynamicTemplateData: email.dynamicData
      }));

      const responses = await sgMail.send(messages);
      
      logger.info(`Bulk emails sent: ${validEmails.length} successful`);
      
      return {
        success: true,
        sent: validEmails.length,
        failed: emails.length - validEmails.length,
        messageIds: responses.map(r => r[0]?.headers['x-message-id'])
      };
    } catch (error) {
      logger.error('Bulk email sending failed:', error);
      throw new IntegrationError('Bulk email delivery failed', 500);
    }
  }

  /**
   * Send welcome email to new vendor
   * @param {Object} vendor - Vendor information
   */
  async sendWelcomeEmail(vendor) {
    return this.sendEmail({
      to: vendor.email,
      templateId: config.email.templates.welcome,
      dynamicData: {
        vendorName: vendor.businessName,
        verificationLink: `${process.env.APP_URL}/verify/${vendor.verificationToken}`,
        loginLink: `${process.env.APP_URL}/login`
      }
    });
  }

  /**
   * Send invoice email
   * @param {Object} invoice - Invoice information
   */
  async sendInvoiceEmail(invoice) {
    return this.sendEmail({
      to: invoice.customerEmail,
      templateId: config.email.templates.invoice,
      dynamicData: {
        invoiceNumber: invoice.number,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        customerName: invoice.customerName,
        pdfLink: invoice.pdfUrl
      }
    });
  }

  validateEmailInput(input, throwError = true) {
    const { to, subject, text, html, templateId } = input;
    
    if (!to || !this.isValidEmail(to)) {
      if (throwError) throw new Error('Invalid recipient email');
      return false;
    }

    if (!templateId && !subject) {
      if (throwError) throw new Error('Subject is required when not using template');
      return false;
    }

    if (!templateId && !text && !html) {
      if (throwError) throw new Error('Email content is required');
      return false;
    }

    return true;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = new EmailService();