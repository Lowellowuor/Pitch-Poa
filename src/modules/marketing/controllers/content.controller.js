const contentGenerator = require('../services/content-generator.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class ContentController {
  /**
   * Generate marketing content
   * @route POST /api/v1/marketing/content/generate
   */
  generateContent = asyncHandler(async (req, res) => {
    const { product, audience, tone, channel, goal } = req.body;

    const content = await contentGenerator.generateContent({
      product,
      audience,
      tone,
      channel,
      goal
    });

    return ApiResponse.success(res, content, 'Content generated successfully');
  });

  /**
   * Generate social media posts
   * @route POST /api/v1/marketing/content/social
   */
  generateSocialPosts = asyncHandler(async (req, res) => {
    const { product, audience, platforms = ['facebook', 'instagram', 'twitter'] } = req.body;

    const posts = await contentGenerator.generateSocialPosts(product, audience, platforms);

    return ApiResponse.success(res, posts, 'Social media posts generated');
  });

  /**
   * Generate email campaign content
   * @route POST /api/v1/marketing/content/email
   */
  generateEmailContent = asyncHandler(async (req, res) => {
    const { type, product, audience, offer } = req.body;

    const email = await contentGenerator.generateEmail(type, product, audience, offer);

    return ApiResponse.success(res, email, 'Email content generated');
  });

  /**
   * Generate SMS content
   * @route POST /api/v1/marketing/content/sms
   */
  generateSMSContent = asyncHandler(async (req, res) => {
    const { message, audience, characterLimit = 160 } = req.body;

    const sms = await contentGenerator.generateSMS(message, audience, characterLimit);

    return ApiResponse.success(res, sms, 'SMS content generated');
  });

  /**
   * Generate WhatsApp message
   * @route POST /api/v1/marketing/content/whatsapp
   */
  generateWhatsAppContent = asyncHandler(async (req, res) => {
    const { message, audience, includeMedia } = req.body;

    const whatsapp = await contentGenerator.generateWhatsApp(message, audience, includeMedia);

    return ApiResponse.success(res, whatsapp, 'WhatsApp content generated');
  });

  /**
   * Generate ad copy
   * @route POST /api/v1/marketing/content/ad
   */
  generateAdCopy = asyncHandler(async (req, res) => {
    const { platform, product, audience, objective } = req.body;

    const ad = await contentGenerator.generateAdCopy(platform, product, audience, objective);

    return ApiResponse.success(res, ad, 'Ad copy generated');
  });

  /**
   * Generate video script
   * @route POST /api/v1/marketing/content/video-script
   */
  generateVideoScript = asyncHandler(async (req, res) => {
    const { product, audience, duration = 60, style } = req.body;

    const script = await contentGenerator.generateVideoScript(product, audience, duration, style);

    return ApiResponse.success(res, script, 'Video script generated');
  });

  /**
   * Generate hashtags
   * @route POST /api/v1/marketing/content/hashtags
   */
  generateHashtags = asyncHandler(async (req, res) => {
    const { topic, count = 10 } = req.body;

    const hashtags = await contentGenerator.generateHashtags(topic, count);

    return ApiResponse.success(res, hashtags, 'Hashtags generated');
  });

  /**
   * Translate content
   * @route POST /api/v1/marketing/content/translate
   */
  translateContent = asyncHandler(async (req, res) => {
    const { content, targetLanguage, sourceLanguage = 'en' } = req.body;

    const translated = await contentGenerator.translateContent(content, targetLanguage, sourceLanguage);

    return ApiResponse.success(res, translated, 'Content translated successfully');
  });

  /**
   * Save generated content
   * @route POST /api/v1/marketing/content/save
   */
  saveContent = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const contentData = req.body;

    const saved = await contentGenerator.saveContent(businessId, contentData);

    return ApiResponse.created(res, saved, 'Content saved successfully');
  });

  /**
   * Get saved content
   * @route GET /api/v1/marketing/content
   */
  getSavedContent = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { type, page = 1, limit = 20 } = req.query;

    const content = await contentGenerator.getSavedContent(businessId, {
      type,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    return ApiResponse.success(res, content, 'Saved content retrieved');
  });
}

module.exports = new ContentController();