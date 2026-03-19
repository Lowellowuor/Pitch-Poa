const express = require('express');
const router = express.Router();

const campaignController = require('../controllers/campaign.controller');
const contentController = require('../controllers/content.controller');
const socialController = require('../controllers/social.controller');
const emailController = require('../controllers/email.controller');
const smsController = require('../controllers/sms.controller');
const whatsappController = require('../controllers/whatsapp.controller');
const audienceController = require('../controllers/audience.controller');
const analyticsController = require('../controllers/analytics.controller');

const { authenticate, authorize } = require('../../../shared/middlewares/auth');
const validate = require('../../../shared/middlewares/validate');
const {
  campaignSchema,
  contentGenerationSchema,
  socialPostSchema,
  emailCampaignSchema,
  smsCampaignSchema,
  whatsAppCampaignSchema,
  audienceSegmentSchema,
  campaignAnalyticsSchema
} = require('../validations/marketing.validation');
const { USER_ROLES } = require('../../../config/constants');

// All marketing routes require authentication
router.use(authenticate);

// ==================== CAMPAIGN ROUTES ====================

router.post('/campaigns',
  validate(campaignSchema),
  campaignController.createCampaign
);

router.get('/campaigns',
  campaignController.getCampaigns
);

router.get('/campaigns/budget-recommendations',
  campaignController.getBudgetRecommendations
);

router.get('/campaigns/performance/summary',
  campaignController.getCampaignsSummary
);

router.get('/campaigns/:id',
  campaignController.getCampaignById
);

router.patch('/campaigns/:id',
  validate(campaignSchema),
  campaignController.updateCampaign
);

router.post('/campaigns/:id/launch',
  campaignController.launchCampaign
);

router.post('/campaigns/:id/pause',
  campaignController.pauseCampaign
);

router.post('/campaigns/:id/stop',
  campaignController.stopCampaign
);

router.post('/campaigns/:id/duplicate',
  campaignController.duplicateCampaign
);

router.get('/campaigns/:id/performance',
  validate(campaignAnalyticsSchema, 'query'),
  campaignController.getCampaignPerformance
);

// ==================== CONTENT ROUTES ====================

router.post('/content/generate',
  validate(contentGenerationSchema),
  contentController.generateContent
);

router.post('/content/social',
  validate(socialPostSchema),
  contentController.generateSocialPosts
);

router.post('/content/email',
  contentController.generateEmailContent
);

router.post('/content/sms',
  contentController.generateSMSContent
);

router.post('/content/whatsapp',
  contentController.generateWhatsAppContent
);

router.post('/content/ad',
  contentController.generateAdCopy
);

router.post('/content/video-script',
  contentController.generateVideoScript
);

router.post('/content/hashtags',
  contentController.generateHashtags
);

router.post('/content/translate',
  contentController.translateContent
);

router.post('/content/save',
  contentController.saveContent
);

router.get('/content',
  contentController.getSavedContent
);

// ==================== SOCIAL MEDIA ROUTES ====================

router.post('/social/connect',
  socialController.connectAccount
);

router.get('/social/accounts',
  socialController.getConnectedAccounts
);

router.post('/social/post',
  validate(socialPostSchema),
  socialController.createPost
);

router.post('/social/schedule',
  validate(socialPostSchema),
  socialController.schedulePost
);

router.get('/social/scheduled',
  socialController.getScheduledPosts
);

router.get('/social/analytics',
  validate(campaignAnalyticsSchema, 'query'),
  socialController.getPostAnalytics
);

router.get('/social/insights',
  socialController.getPageInsights
);

router.post('/social/engage',
  socialController.engageWithComments
);

router.get('/social/best-times',
  socialController.getBestPostingTimes
);

// ==================== EMAIL MARKETING ROUTES ====================

router.post('/email/send',
  validate(emailCampaignSchema),
  emailController.sendEmail
);

router.post('/email/bulk',
  validate(emailCampaignSchema),
  emailController.sendBulkEmail
);

router.post('/email/templates',
  emailController.createTemplate
);

router.get('/email/templates',
  emailController.getTemplates
);

router.post('/email/lists',
  emailController.createContactList
);

router.post('/email/lists/:listId/contacts',
  emailController.addContacts
);

router.get('/email/analytics',
  validate(campaignAnalyticsSchema, 'query'),
  emailController.getEmailAnalytics
);

router.post('/email/schedule',
  emailController.scheduleEmailCampaign
);

router.get('/email/segment-performance',
  emailController.getSegmentPerformance
);

// ==================== SMS MARKETING ROUTES ====================

router.post('/sms/send',
  validate(smsCampaignSchema),
  smsController.sendSMS
);

router.post('/sms/bulk',
  validate(smsCampaignSchema),
  smsController.sendBulkSMS
);

router.post('/sms/templates',
  smsController.createSMSTemplate
);

router.get('/sms/templates',
  smsController.getSMSTemplates
);

router.get('/sms/analytics',
  validate(campaignAnalyticsSchema, 'query'),
  smsController.getSMSAnalytics
);

router.get('/sms/delivery/:messageId',
  smsController.getDeliveryReport
);

router.get('/sms/sender-ids',
  smsController.getSenderIDs
);

router.post('/sms/request-sender-id',
  smsController.requestSenderID
);

router.post('/sms/schedule',
  smsController.scheduleSMSCampaign
);

router.get('/sms/costs',
  smsController.getSMSCosts
);

router.post('/sms/opt-out',
  smsController.optOut
);

// ==================== WHATSAPP MARKETING ROUTES ====================

router.post('/whatsapp/send',
  validate(whatsAppCampaignSchema),
  whatsappController.sendMessage
);

router.post('/whatsapp/template',
  whatsappController.sendTemplateMessage
);

router.post('/whatsapp/templates',
  whatsappController.createTemplate
);

router.get('/whatsapp/templates',
  whatsappController.getTemplates
);

router.post('/whatsapp/bulk',
  whatsappController.sendBulkMessages
);

router.get('/whatsapp/analytics',
  validate(campaignAnalyticsSchema, 'query'),
  whatsappController.getMessageAnalytics
);

router.get('/whatsapp/profile',
  whatsappController.getBusinessProfile
);

router.patch('/whatsapp/profile',
  whatsappController.updateBusinessProfile
);

router.post('/whatsapp/webhook',
  whatsappController.setupWebhook
);

router.get('/whatsapp/qr',
  whatsappController.getQRCode
);

router.get('/whatsapp/conversations',
  whatsappController.getConversations
);

router.post('/whatsapp/read',
  whatsappController.markAsRead
);

// ==================== AUDIENCE MANAGEMENT ROUTES ====================

router.post('/audience/segments',
  validate(audienceSegmentSchema),
  audienceController.createSegment
);

router.get('/audience/segments',
  audienceController.getSegments
);

router.get('/audience/segments/:id',
  audienceController.getSegmentById
);

router.patch('/audience/segments/:id',
  validate(audienceSegmentSchema),
  audienceController.updateSegment
);

router.delete('/audience/segments/:id',
  audienceController.deleteSegment
);

router.get('/audience/segments/:id/size',
  audienceController.getSegmentSize
);

router.post('/audience/lookalike',
  audienceController.createLookalike
);

router.get('/audience/insights',
  audienceController.getAudienceInsights
);

router.get('/audience/demographics',
  audienceController.getDemographics
);

router.get('/audience/geography',
  audienceController.getGeographicDistribution
);

router.get('/audience/behavior',
  audienceController.getBehavioralInsights
);

router.post('/audience/import',
  audienceController.importAudience
);

router.get('/audience/export',
  audienceController.exportAudience
);

router.get('/audience/predict-lookalike',
  audienceController.predictLookalikePotential
);

// ==================== MARKETING ANALYTICS ROUTES ====================

router.get('/analytics/dashboard',
  validate(campaignAnalyticsSchema, 'query'),
  analyticsController.getMarketingDashboard
);

router.get('/analytics/channels',
  validate(campaignAnalyticsSchema, 'query'),
  analyticsController.getChannelPerformance
);

router.get('/analytics/roi',
  validate(campaignAnalyticsSchema, 'query'),
  analyticsController.getROIAnalysis
);

router.get('/analytics/attribution',
  validate(campaignAnalyticsSchema, 'query'),
  analyticsController.getAttributionAnalysis
);

router.get('/analytics/conversions',
  validate(campaignAnalyticsSchema, 'query'),
  analyticsController.getConversions
);

router.get('/analytics/journey',
  analyticsController.getCustomerJourney
);

router.get('/analytics/ab-test',
  analyticsController.getABTestResults
);

router.get('/analytics/predict',
  analyticsController.getPredictiveAnalytics
);

router.get('/analytics/cpa',
  validate(campaignAnalyticsSchema, 'query'),
  analyticsController.getCostPerAcquisition
);

router.get('/analytics/roas',
  validate(campaignAnalyticsSchema, 'query'),
  analyticsController.getROAS
);

router.post('/analytics/export',
  analyticsController.exportMarketingReport
);

// ==================== WEBHOOKS (Public) ====================

router.post('/webhooks/email',
  emailController.trackEmailEvent
);

router.post('/webhooks/sms',
  smsController.getDeliveryReport
);

router.post('/webhooks/whatsapp',
  whatsappController.setupWebhook
);

module.exports = router;