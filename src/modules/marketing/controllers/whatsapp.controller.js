const whatsappBusinessAPI = require('../services/external-apis/whatsapp-business-api.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class WhatsAppController {
  /**
   * Send WhatsApp message
   * @route POST /api/v1/marketing/whatsapp/send
   */
  sendMessage = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { to, message, type = 'text', media } = req.body;

    const result = await whatsappBusinessAPI.sendMessage(businessId, {
      to,
      type,
      content: message,
      media
    });

    return ApiResponse.success(res, result, 'WhatsApp message sent');
  });

  /**
   * Send template message
   * @route POST /api/v1/marketing/whatsapp/template
   */
  sendTemplateMessage = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { to, templateName, language, components } = req.body;

    const result = await whatsappBusinessAPI.sendTemplateMessage(
      businessId,
      to,
      templateName,
      language,
      components
    );

    return ApiResponse.success(res, result, 'Template message sent');
  });

  /**
   * Create message template
   * @route POST /api/v1/marketing/whatsapp/templates
   */
  createTemplate = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { name, language, category, components } = req.body;

    const template = await whatsappBusinessAPI.createTemplate(businessId, {
      name,
      language,
      category,
      components
    });

    return ApiResponse.created(res, template, 'WhatsApp template created');
  });

  /**
   * Get message templates
   * @route GET /api/v1/marketing/whatsapp/templates
   */
  getTemplates = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const templates = await whatsappBusinessAPI.getTemplates(businessId);

    return ApiResponse.success(res, templates, 'WhatsApp templates retrieved');
  });

  /**
   * Send bulk WhatsApp messages
   * @route POST /api/v1/marketing/whatsapp/bulk
   */
  sendBulkMessages = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { recipients, message, templateName, segmentId } = req.body;

    const campaign = await whatsappBusinessAPI.sendBulkMessages(businessId, {
      recipients,
      message,
      templateName,
      segmentId
    });

    return ApiResponse.success(res, campaign, 'Bulk WhatsApp campaign started');
  });

  /**
   * Get message analytics
   * @route GET /api/v1/marketing/whatsapp/analytics
   */
  getMessageAnalytics = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { messageId, period = '30d' } = req.query;

    const analytics = await whatsappBusinessAPI.getMessageAnalytics(businessId, messageId, period);

    return ApiResponse.success(res, analytics, 'Message analytics retrieved');
  });

  /**
   * Get business profile
   * @route GET /api/v1/marketing/whatsapp/profile
   */
  getBusinessProfile = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const profile = await whatsappBusinessAPI.getBusinessProfile(businessId);

    return ApiResponse.success(res, profile, 'Business profile retrieved');
  });

  /**
   * Update business profile
   * @route PATCH /api/v1/marketing/whatsapp/profile
   */
  updateBusinessProfile = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { about, description, email, websites } = req.body;

    const profile = await whatsappBusinessAPI.updateBusinessProfile(businessId, {
      about,
      description,
      email,
      websites
    });

    return ApiResponse.success(res, profile, 'Business profile updated');
  });

  /**
   * Set up webhook
   * @route POST /api/v1/marketing/whatsapp/webhook
   */
  setupWebhook = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { url, events } = req.body;

    const webhook = await whatsappBusinessAPI.setupWebhook(businessId, url, events);

    return ApiResponse.success(res, webhook, 'Webhook configured');
  });

  /**
   * Get QR code for WhatsApp link
   * @route GET /api/v1/marketing/whatsapp/qr
   */
  getQRCode = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { phoneNumber, message } = req.query;

    const qr = await whatsappBusinessAPI.generateQRCode(businessId, phoneNumber, message);

    return ApiResponse.success(res, qr, 'QR code generated');
  });

  /**
   * Get conversation history
   * @route GET /api/v1/marketing/whatsapp/conversations
   */
  getConversations = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { customerId, limit = 50, before } = req.query;

    const conversations = await whatsappBusinessAPI.getConversations(
      businessId,
      customerId,
      parseInt(limit),
      before
    );

    return ApiResponse.success(res, conversations, 'Conversations retrieved');
  });

  /**
   * Mark conversation as read
   * @route POST /api/v1/marketing/whatsapp/read
   */
  markAsRead = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { messageId } = req.body;

    const result = await whatsappBusinessAPI.markAsRead(businessId, messageId);

    return ApiResponse.success(res, result, 'Message marked as read');
  });
}

module.exports = new WhatsAppController();