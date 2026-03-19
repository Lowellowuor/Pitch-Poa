const campaignAnalytics = require('../services/analytics/campaign-analytics.service');
const roiCalculator = require('../services/analytics/roi-calculator.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class MarketingAnalyticsController {
  /**
   * Get campaign performance
   * @route GET /api/v1/marketing/analytics/campaigns/:id
   */
  getCampaignAnalytics = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { period = '30d' } = req.query;

    const analytics = await campaignAnalytics.getCampaignAnalytics(businessId, id, period);

    return ApiResponse.success(res, analytics, 'Campaign analytics retrieved');
  });

  /**
   * Get channel performance
   * @route GET /api/v1/marketing/analytics/channels
   */
  getChannelPerformance = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const performance = await campaignAnalytics.getChannelPerformance(businessId, period);

    return ApiResponse.success(res, performance, 'Channel performance retrieved');
  });

  /**
   * Get ROI analysis
   * @route GET /api/v1/marketing/analytics/roi
   */
  getROIAnalysis = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { campaignId, period = '30d' } = req.query;

    const roi = await roiCalculator.calculateROI(businessId, campaignId, period);

    return ApiResponse.success(res, roi, 'ROI analysis retrieved');
  });

  /**
   * Get attribution analysis
   * @route GET /api/v1/marketing/analytics/attribution
   */
  getAttributionAnalysis = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d', model = 'last-click' } = req.query;

    const attribution = await campaignAnalytics.getAttributionAnalysis(
      businessId,
      period,
      model
    );

    return ApiResponse.success(res, attribution, 'Attribution analysis retrieved');
  });

  /**
   * Get conversion tracking
   * @route GET /api/v1/marketing/analytics/conversions
   */
  getConversions = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { campaignId, period = '30d' } = req.query;

    const conversions = await campaignAnalytics.getConversions(businessId, campaignId, period);

    return ApiResponse.success(res, conversions, 'Conversions retrieved');
  });

  /**
   * Get customer journey tracking
   * @route GET /api/v1/marketing/analytics/journey
   */
  getCustomerJourney = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { customerId, campaignId } = req.query;

    const journey = await campaignAnalytics.getCustomerJourney(businessId, customerId, campaignId);

    return ApiResponse.success(res, journey, 'Customer journey retrieved');
  });

  /**
   * Get A/B test results
   * @route GET /api/v1/marketing/analytics/ab-test
   */
  getABTestResults = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { testId } = req.query;

    const results = await campaignAnalytics.getABTestResults(businessId, testId);

    return ApiResponse.success(res, results, 'A/B test results retrieved');
  });

  /**
   * Get predictive analytics
   * @route GET /api/v1/marketing/analytics/predict
   */
  getPredictiveAnalytics = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { campaignId, metric = 'conversions' } = req.query;

    const prediction = await campaignAnalytics.predictPerformance(businessId, campaignId, metric);

    return ApiResponse.success(res, prediction, 'Predictive analytics retrieved');
  });

  /**
   * Get cost per acquisition
   * @route GET /api/v1/marketing/analytics/cpa
   */
  getCostPerAcquisition = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { campaignId, period = '30d' } = req.query;

    const cpa = await roiCalculator.calculateCPA(businessId, campaignId, period);

    return ApiResponse.success(res, cpa, 'Cost per acquisition retrieved');
  });

  /**
   * Get return on ad spend
   * @route GET /api/v1/marketing/analytics/roas
   */
  getROAS = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { campaignId, period = '30d' } = req.query;

    const roas = await roiCalculator.calculateROAS(businessId, campaignId, period);

    return ApiResponse.success(res, roas, 'Return on ad spend retrieved');
  });

  /**
   * Get marketing dashboard
   * @route GET /api/v1/marketing/analytics/dashboard
   */
  getMarketingDashboard = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const dashboard = await campaignAnalytics.getMarketingDashboard(businessId, period);

    return ApiResponse.success(res, dashboard, 'Marketing dashboard retrieved');
  });

  /**
   * Export marketing report
   * @route POST /api/v1/marketing/analytics/export
   */
  exportMarketingReport = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { format = 'pdf', period = '30d', channels } = req.body;

    const report = await campaignAnalytics.exportReport(businessId, {
      format,
      period,
      channels: channels ? channels.split(',') : null
    });

    return ApiResponse.success(res, report, 'Marketing report exported');
  });
}

module.exports = new MarketingAnalyticsController();