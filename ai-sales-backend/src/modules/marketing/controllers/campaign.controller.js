const campaignService = require('../services/campaign.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class CampaignController {
  /**
   * Create a new marketing campaign
   * @route POST /api/v1/marketing/campaigns
   */
  createCampaign = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const campaignData = req.body;

    const campaign = await campaignService.createCampaign(businessId, campaignData);

    return ApiResponse.created(res, campaign, 'Campaign created successfully');
  });

  /**
   * Get all campaigns
   * @route GET /api/v1/marketing/campaigns
   */
  getCampaigns = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { status, channel, page = 1, limit = 20 } = req.query;

    const campaigns = await campaignService.getCampaigns(businessId, {
      status,
      channel,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    return ApiResponse.success(res, campaigns, 'Campaigns retrieved successfully');
  });

  /**
   * Get campaign by ID
   * @route GET /api/v1/marketing/campaigns/:id
   */
  getCampaignById = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;

    const campaign = await campaignService.getCampaignById(businessId, id);

    return ApiResponse.success(res, campaign, 'Campaign retrieved successfully');
  });

  /**
   * Update campaign
   * @route PATCH /api/v1/marketing/campaigns/:id
   */
  updateCampaign = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const updateData = req.body;

    const campaign = await campaignService.updateCampaign(businessId, id, updateData);

    return ApiResponse.success(res, campaign, 'Campaign updated successfully');
  });

  /**
   * Launch campaign
   * @route POST /api/v1/marketing/campaigns/:id/launch
   */
  launchCampaign = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;

    const campaign = await campaignService.launchCampaign(businessId, id);

    return ApiResponse.success(res, campaign, 'Campaign launched successfully');
  });

  /**
   * Pause campaign
   * @route POST /api/v1/marketing/campaigns/:id/pause
   */
  pauseCampaign = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;

    const campaign = await campaignService.pauseCampaign(businessId, id);

    return ApiResponse.success(res, campaign, 'Campaign paused successfully');
  });

  /**
   * Stop campaign
   * @route POST /api/v1/marketing/campaigns/:id/stop
   */
  stopCampaign = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;

    const campaign = await campaignService.stopCampaign(businessId, id);

    return ApiResponse.success(res, campaign, 'Campaign stopped successfully');
  });

  /**
   * Duplicate campaign
   * @route POST /api/v1/marketing/campaigns/:id/duplicate
   */
  duplicateCampaign = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;

    const campaign = await campaignService.duplicateCampaign(businessId, id);

    return ApiResponse.success(res, campaign, 'Campaign duplicated successfully');
  });

  /**
   * Get campaign budget recommendations
   * @route GET /api/v1/marketing/campaigns/budget-recommendations
   */
  getBudgetRecommendations = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { channel, goal, audience } = req.query;

    const recommendations = await campaignService.getBudgetRecommendations(
      businessId,
      { channel, goal, audience }
    );

    return ApiResponse.success(res, recommendations, 'Budget recommendations retrieved');
  });

  /**
   * Get campaign performance
   * @route GET /api/v1/marketing/campaigns/:id/performance
   */
  getCampaignPerformance = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { period = '7d' } = req.query;

    const performance = await campaignService.getCampaignPerformance(businessId, id, period);

    return ApiResponse.success(res, performance, 'Campaign performance retrieved');
  });

  /**
   * Get all campaigns performance summary
   * @route GET /api/v1/marketing/campaigns/performance/summary
   */
  getCampaignsSummary = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const summary = await campaignService.getCampaignsSummary(businessId, period);

    return ApiResponse.success(res, summary, 'Campaigns summary retrieved');
  });
}

module.exports = new CampaignController();