const metaAPI = require('../services/external-apis/meta-api.service');
const twitterAPI = require('../services/external-apis/twitter-api.service');
const linkedinAPI = require('../services/external-apis/linkedin-api.service');
const tiktokAPI = require('../services/external-apis/tiktok-api.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class SocialController {
  /**
   * Connect social media account
   * @route POST /api/v1/marketing/social/connect
   */
  connectAccount = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { platform, authCode, redirectUri } = req.body;

    let connection;
    switch (platform) {
      case 'facebook':
      case 'instagram':
        connection = await metaAPI.connectAccount(businessId, authCode, redirectUri);
        break;
      case 'twitter':
        connection = await twitterAPI.connectAccount(businessId, authCode);
        break;
      case 'linkedin':
        connection = await linkedinAPI.connectAccount(businessId, authCode);
        break;
      case 'tiktok':
        connection = await tiktokAPI.connectAccount(businessId, authCode);
        break;
      default:
        return ApiResponse.error(res, { message: 'Unsupported platform', statusCode: 400 });
    }

    return ApiResponse.success(res, connection, `${platform} account connected`);
  });

  /**
   * Get connected accounts
   * @route GET /api/v1/marketing/social/accounts
   */
  getConnectedAccounts = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const accounts = await socialService.getConnectedAccounts(businessId);

    return ApiResponse.success(res, accounts, 'Connected accounts retrieved');
  });

  /**
   * Post to social media
   * @route POST /api/v1/marketing/social/post
   */
  createPost = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { platforms, content, media, schedule } = req.body;

    const results = [];

    for (const platform of platforms) {
      try {
        let result;
        switch (platform) {
          case 'facebook':
            result = await metaAPI.createFacebookPost(businessId, content, media);
            break;
          case 'instagram':
            result = await metaAPI.createInstagramPost(businessId, content, media);
            break;
          case 'twitter':
            result = await twitterAPI.createTweet(businessId, content, media);
            break;
          case 'linkedin':
            result = await linkedinAPI.createPost(businessId, content, media);
            break;
          case 'tiktok':
            result = await tiktokAPI.createVideo(businessId, content, media);
            break;
        }
        results.push({ platform, success: true, data: result });
      } catch (error) {
        results.push({ platform, success: false, error: error.message });
      }
    }

    return ApiResponse.success(res, results, 'Posts created');
  });

  /**
   * Schedule post
   * @route POST /api/v1/marketing/social/schedule
   */
  schedulePost = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { platforms, content, media, scheduledTime } = req.body;

    const scheduled = await socialService.schedulePost(
      businessId,
      platforms,
      content,
      media,
      scheduledTime
    );

    return ApiResponse.success(res, scheduled, 'Post scheduled');
  });

  /**
   * Get scheduled posts
   * @route GET /api/v1/marketing/social/scheduled
   */
  getScheduledPosts = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const scheduled = await socialService.getScheduledPosts(businessId);

    return ApiResponse.success(res, scheduled, 'Scheduled posts retrieved');
  });

  /**
   * Get post analytics
   * @route GET /api/v1/marketing/social/analytics
   */
  getPostAnalytics = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { platform, postId, period = '7d' } = req.query;

    let analytics;
    switch (platform) {
      case 'facebook':
      case 'instagram':
        analytics = await metaAPI.getPostAnalytics(businessId, postId, period);
        break;
      case 'twitter':
        analytics = await twitterAPI.getTweetAnalytics(businessId, postId, period);
        break;
      case 'linkedin':
        analytics = await linkedinAPI.getPostAnalytics(businessId, postId, period);
        break;
      default:
        return ApiResponse.error(res, { message: 'Unsupported platform', statusCode: 400 });
    }

    return ApiResponse.success(res, analytics, 'Post analytics retrieved');
  });

  /**
   * Get page insights
   * @route GET /api/v1/marketing/social/insights
   */
  getPageInsights = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { platform, period = '30d' } = req.query;

    let insights;
    switch (platform) {
      case 'facebook':
        insights = await metaAPI.getFacebookInsights(businessId, period);
        break;
      case 'instagram':
        insights = await metaAPI.getInstagramInsights(businessId, period);
        break;
      case 'twitter':
        insights = await twitterAPI.getProfileAnalytics(businessId, period);
        break;
      case 'linkedin':
        insights = await linkedinAPI.getCompanyInsights(businessId, period);
        break;
      default:
        return ApiResponse.error(res, { message: 'Unsupported platform', statusCode: 400 });
    }

    return ApiResponse.success(res, insights, 'Page insights retrieved');
  });

  /**
   * Engage with comments
   * @route POST /api/v1/marketing/social/engage
   */
  engageWithComments = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { platform, postId, commentId, reply } = req.body;

    let result;
    switch (platform) {
      case 'facebook':
        result = await metaAPI.replyToComment(businessId, postId, commentId, reply);
        break;
      case 'instagram':
        result = await metaAPI.replyToInstagramComment(businessId, postId, commentId, reply);
        break;
      case 'twitter':
        result = await twitterAPI.replyToTweet(businessId, postId, reply);
        break;
      default:
        return ApiResponse.error(res, { message: 'Unsupported platform', statusCode: 400 });
    }

    return ApiResponse.success(res, result, 'Engagement sent');
  });

  /**
   * Get best posting times
   * @route GET /api/v1/marketing/social/best-times
   */
  getBestPostingTimes = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { platform } = req.query;

    const times = await socialService.getBestPostingTimes(businessId, platform);

    return ApiResponse.success(res, times, 'Best posting times retrieved');
  });
}

module.exports = new SocialController();