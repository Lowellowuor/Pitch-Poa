/**
 * WhatsApp Service
 * Handles WhatsApp communications using Twilio
 */

const twilio = require('twilio');
const config = require('./config/integrations.config');
const logger = require('../config/logger');
const { IntegrationError } = require('./utils/http-client');

class WhatsAppService {
  constructor() {
    this.provider = config.whatsapp.provider;
    
    if (this.provider === 'twilio') {
      this.client = twilio(
        config.whatsapp.accountSid,
        config.whatsapp.authToken
      );
    }
    
    logger.info(`WhatsApp service initialized with provider: ${this.provider}`);
  }

  /**
   * Send WhatsApp message
   * @param {Object} options - Message options
   * @param {string} options.to - Recipient phone number
   * @param {string} options.message - Message content
   * @param {string} options.mediaUrl - Optional media URL
   * @param {Object} options.template - Optional template for business-initiated messages
   */
  async sendMessage({ to, message, mediaUrl, template }) {
    try {
      this.validateInput({ to, message, template });

      const formattedNumber = this.formatPhoneNumber(to, 'whatsapp');
      
      let messageOptions = {
        from: `whatsapp:${config.whatsapp.phoneNumber}`,
        to: formattedNumber,
        body: message
      };

      if (mediaUrl) {
        messageOptions.mediaUrl = mediaUrl;
      }

      if (template) {
        messageOptions = this.prepareTemplateMessage(formattedNumber, template);
      }

      const response = await this.client.messages.create(messageOptions);

      logger.info(`WhatsApp message sent to ${formattedNumber}`, {
        messageSid: response.sid,
        status: response.status
      });

      return {
        success: true,
        messageSid: response.sid,
        status: response.status,
        to: formattedNumber
      };
    } catch (error) {
      logger.error('Failed to send WhatsApp message:', {
        to,
        error: error.message
      });

      throw new IntegrationError(
        'WhatsApp message delivery failed',
        500,
        error.response?.data
      );
    }
  }

  /**
   * Send template message (for business-initiated conversations)
   * @param {string} to - Recipient phone number
   * @param {string} templateName - Template name
   * @param {Array} components - Template components
   */
  async sendTemplateMessage(to, templateName, components = []) {
    return this.sendMessage({
      to,
      template: {
        name: templateName,
        language: 'en',
        components
      }
    });
  }

  /**
   * Send order update via WhatsApp
   * @param {Object} order - Order information
   */
  async sendOrderUpdate(order) {
    const message = `Pitch Poa: Order #${order.orderNumber} is now ${order.status}. ` +
                   `Expected delivery: ${order.estimatedDelivery}. ` +
                   `Track here: ${process.env.APP_URL}/orders/${order.orderNumber}`;

    return this.sendMessage({
      to: order.customerPhone,
      message
    });
  }

  /**
   * Send product catalog
   * @param {string} to - Customer phone number
   * @param {Array} products - List of products
   */
  async sendProductCatalog(to, products) {
    // For catalogs, we'd use interactive messages
    const message = `Check out our latest products:\n\n${products
      .map(p => `• ${p.name} - KES ${p.price}\n  ${p.description.substring(0, 50)}...`)
      .join('\n\n')}\n\nReply with product numbers to order.`;

    return this.sendMessage({
      to,
      message
    });
  }

  /**
   * Handle incoming WhatsApp message
   * @param {Object} webhookData - Twilio webhook data
   */
  async handleIncomingMessage(webhookData) {
    logger.info('Incoming WhatsApp message:', webhookData);

    const {
      From: from,
      Body: body,
      MessageSid: messageSid,
      MediaUrl0: mediaUrl
    } = webhookData;

    // Process based on message type and content
    if (body.toLowerCase().includes('order')) {
      // Handle order related queries
      return this.handleOrderInquiry(from, body);
    } else if (mediaUrl) {
      // Handle media messages
      return this.handleMediaMessage(from, mediaUrl);
    } else {
      // Default response
      return this.sendMessage({
        to: from,
        message: 'Thank you for your message! Our team will respond shortly.'
      });
    }
  }

  async handleOrderInquiry(from, message) {
    // Extract order number from message
    const orderNumber = message.match(/\d+/)?.[0];
    
    if (orderNumber) {
      // Fetch order details from database
      return this.sendMessage({
        to: from,
        message: `Looking up order #${orderNumber}...`
      });
    }
    
    return this.sendMessage({
      to: from,
      message: 'Please provide your order number.'
    });
  }

  async handleMediaMessage(from, mediaUrl) {
    // Process received media
    logger.info(`Media received from ${from}: ${mediaUrl}`);
    
    return this.sendMessage({
      to: from,
      message: 'We received your image! Our team will review it.'
    });
  }

  /**
   * Check message status
   * @param {string} messageSid - Twilio message SID
   */
  async getMessageStatus(messageSid) {
    try {
      const message = await this.client.messages(messageSid).fetch();
      
      return {
        success: true,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error) {
      logger.error('Failed to fetch message status:', error);
      throw new IntegrationError('Failed to fetch message status', 500);
    }
  }

  prepareTemplateMessage(to, template) {
    return {
      from: `whatsapp:${config.whatsapp.phoneNumber}`,
      to,
      contentSid: this.getTemplateSid(template.name),
      contentVariables: JSON.stringify(
        this.mapTemplateVariables(template.components)
      )
    };
  }

  getTemplateSid(templateName) {
    // Map template names to Twilio content SIDs
    const templateMap = {
      'order_confirmation': 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
      'shipping_update': 'HXb5b62575e6e4ff6129ad7c8efe1f983f',
      'payment_received': 'HXb5b62575e6e4ff6129ad7c8efe1f983g'
    };
    
    return templateMap[templateName];
  }

  mapTemplateVariables(components) {
    return components.reduce((acc, comp, index) => {
      acc[`${index + 1}`] = comp.value;
      return acc;
    }, {});
  }

  validateInput({ to, message, template }) {
    if (!to) {
      throw new Error('Recipient phone number is required');
    }

    if (!template && !message) {
      throw new Error('Either message or template is required');
    }

    if (message && message.length > 4096) {
      throw new Error('WhatsApp message exceeds 4096 characters');
    }

    return true;
  }

  formatPhoneNumber(phoneNumber, prefix = 'whatsapp') {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return `${prefix}:+${cleaned}`;
  }
}

module.exports = new WhatsAppService();