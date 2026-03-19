const sendgridAPI = require('../services/external-apis/sendgrid-api.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class EmailController {
  /**
   * Send marketing email
   * @route POST /api/v1/marketing/email/send
   */
  sendEmail = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { to, subject, content, from, attachments } = req.body;

    const result = await sendgridAPI.sendEmail(businessId, {
      to,
      from: from || process.env.SMTP_FROM,
      subject,
      html: content,
      attachments
    });

    return ApiResponse.success(res, result, 'Email sent successfully');
  });

  /**
   * Send bulk email campaign
   * @route POST /api/v1/marketing/email/bulk
   */
  sendBulkEmail = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { recipients, subject, content, from, segmentId } = req.body;

    const campaign = await sendgridAPI.sendBulkEmail(businessId, {
      recipients,
      from: from || process.env.SMTP_FROM,
      subject,
      html: content,
      segmentId
    });

    return ApiResponse.success(res, campaign, 'Bulk email campaign started');
  });

  /**
   * Create email template
   * @route POST /api/v1/marketing/email/templates
   */
  createTemplate = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { name, subject, html, plainText } = req.body;

    const template = await sendgridAPI.createTemplate(businessId, {
      name,
      subject,
      html,
      plainText
    });

    return ApiResponse.created(res, template, 'Email template created');
  });

  /**
   * Get email templates
   * @route GET /api/v1/marketing/email/templates
   */
  getTemplates = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const templates = await sendgridAPI.getTemplates(businessId);

    return ApiResponse.success(res, templates, 'Email templates retrieved');
  });

  /**
   * Create contact list
   * @route POST /api/v1/marketing/email/lists
   */
  createContactList = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { name, contacts } = req.body;

    const list = await sendgridAPI.createContactList(businessId, name, contacts);

    return ApiResponse.created(res, list, 'Contact list created');
  });

  /**
   * Add contacts to list
   * @route POST /api/v1/marketing/email/lists/:listId/contacts
   */
  addContacts = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { listId } = req.params;
    const { contacts } = req.body;

    const result = await sendgridAPI.addContactsToList(businessId, listId, contacts);

    return ApiResponse.success(res, result, 'Contacts added to list');
  });

  /**
   * Get email analytics
   * @route GET /api/v1/marketing/email/analytics
   */
  getEmailAnalytics = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { campaignId, period = '30d' } = req.query;

    const analytics = await sendgridAPI.getEmailAnalytics(businessId, campaignId, period);

    return ApiResponse.success(res, analytics, 'Email analytics retrieved');
  });

  /**
   * Track email opens/clicks
   * @route POST /api/v1/marketing/email/track
   */
  trackEmailEvent = asyncHandler(async (req, res) => {
    const { event, email, campaignId, timestamp } = req.body;

    await sendgridAPI.trackEvent(event, email, campaignId, timestamp);

    return ApiResponse.success(res, null, 'Event tracked');
  });

  /**
   * Schedule email campaign
   * @route POST /api/v1/marketing/email/schedule
   */
  scheduleEmailCampaign = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { campaignId, scheduledTime } = req.body;

    const scheduled = await sendgridAPI.scheduleCampaign(businessId, campaignId, scheduledTime);

    return ApiResponse.success(res, scheduled, 'Email campaign scheduled');
  });

  /**
   * Get email performance by segment
   * @route GET /api/v1/marketing/email/segment-performance
   */
  getSegmentPerformance = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { segmentId, period = '30d' } = req.query;

    const performance = await sendgridAPI.getSegmentPerformance(businessId, segmentId, period);

    return ApiResponse.success(res, performance, 'Segment performance retrieved');
  });
}

module.exports = new EmailController();