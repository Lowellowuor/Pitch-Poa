const africastalkingAPI = require('../services/external-apis/africastalking-api.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class SMSController {
  /**
   * Send SMS
   * @route POST /api/v1/marketing/sms/send
   */
  sendSMS = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { to, message, senderId } = req.body;

    const result = await africastalkingAPI.sendSMS(businessId, {
      to: Array.isArray(to) ? to : [to],
      message,
      senderId: senderId || process.env.AT_SENDER_ID
    });

    return ApiResponse.success(res, result, 'SMS sent successfully');
  });

  /**
   * Send bulk SMS
   * @route POST /api/v1/marketing/sms/bulk
   */
  sendBulkSMS = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { recipients, message, senderId, segmentId } = req.body;

    const campaign = await africastalkingAPI.sendBulkSMS(businessId, {
      recipients,
      message,
      senderId: senderId || process.env.AT_SENDER_ID,
      segmentId
    });

    return ApiResponse.success(res, campaign, 'Bulk SMS campaign started');
  });

  /**
   * Create SMS template
   * @route POST /api/v1/marketing/sms/templates
   */
  createSMSTemplate = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { name, message } = req.body;

    const template = await africastalkingAPI.createTemplate(businessId, name, message);

    return ApiResponse.created(res, template, 'SMS template created');
  });

  /**
   * Get SMS templates
   * @route GET /api/v1/marketing/sms/templates
   */
  getSMSTemplates = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const templates = await africastalkingAPI.getTemplates(businessId);

    return ApiResponse.success(res, templates, 'SMS templates retrieved');
  });

  /**
   * Get SMS analytics
   * @route GET /api/v1/marketing/sms/analytics
   */
  getSMSAnalytics = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { campaignId, period = '30d' } = req.query;

    const analytics = await africastalkingAPI.getSMSAnalytics(businessId, campaignId, period);

    return ApiResponse.success(res, analytics, 'SMS analytics retrieved');
  });

  /**
   * Get delivery reports
   * @route GET /api/v1/marketing/sms/delivery/:messageId
   */
  getDeliveryReport = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { messageId } = req.params;

    const report = await africastalkingAPI.getDeliveryReport(businessId, messageId);

    return ApiResponse.success(res, report, 'Delivery report retrieved');
  });

  /**
   * Get sender IDs
   * @route GET /api/v1/marketing/sms/sender-ids
   */
  getSenderIDs = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const senderIds = await africastalkingAPI.getSenderIDs(businessId);

    return ApiResponse.success(res, senderIds, 'Sender IDs retrieved');
  });

  /**
   * Request sender ID
   * @route POST /api/v1/marketing/sms/request-sender-id
   */
  requestSenderID = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { senderId, purpose } = req.body;

    const request = await africastalkingAPI.requestSenderID(businessId, senderId, purpose);

    return ApiResponse.success(res, request, 'Sender ID requested');
  });

  /**
   * Schedule SMS campaign
   * @route POST /api/v1/marketing/sms/schedule
   */
  scheduleSMSCampaign = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { campaignId, scheduledTime } = req.body;

    const scheduled = await africastalkingAPI.scheduleCampaign(businessId, campaignId, scheduledTime);

    return ApiResponse.success(res, scheduled, 'SMS campaign scheduled');
  });

  /**
   * Get SMS costs
   * @route GET /api/v1/marketing/sms/costs
   */
  getSMSCosts = asyncHandler(async (req, res) => {
    const { count, network } = req.query;

    const costs = await africastalkingAPI.calculateSMSCosts(parseInt(count), network);

    return ApiResponse.success(res, costs, 'SMS costs calculated');
  });

  /**
   * Opt-out management
   * @route POST /api/v1/marketing/sms/opt-out
   */
  optOut = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { phoneNumber } = req.body;

    const result = await africastalkingAPI.optOut(businessId, phoneNumber);

    return ApiResponse.success(res, result, 'Opt-out processed');
  });
}

module.exports = new SMSController();