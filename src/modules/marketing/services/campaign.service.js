const Campaign = require('../models/campaign.model');
const metaAPI = require('./external-apis/meta-api.service');
const googleAdsAPI = require('./external-apis/google-ads-api.service');
const sendgridAPI = require('./external-apis/sendgrid-api.service');
const africastalkingAPI = require('./external-apis/africastalking-api.service');
const whatsappBusinessAPI = require('./external-apis/whatsapp-business-api.service');
const campaignAnalytics = require('./analytics/campaign-analytics.service');
const ApiError = require('../../../shared/utils/apiError');

class CampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(businessId, campaignData) {
    try {
      const campaign = new Campaign({
        businessId,
        ...campaignData,
        status: 'draft'
      });

      await campaign.save();

      // Create on external platforms if specified
      if (campaignData.launchImmediately) {
        await this.launchOnExternalPlatforms(campaign);
      }

      return campaign;
    } catch (error) {
      throw new ApiError(500, `Failed to create campaign: ${error.message}`);
    }
  }

  /**
   * Get campaigns with filters
   */
  async getCampaigns(businessId, filters) {
    const query = { businessId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.channel) {
      query.channel = filters.channel;
    }

    const total = await Campaign.countDocuments(query);

    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit)
      .lean();

    // Get performance metrics for each campaign
    const campaignsWithMetrics = await Promise.all(
      campaigns.map(async (campaign) => {
        const metrics = await campaignAnalytics.getCampaignSummary(
          businessId,
          campaign._id
        );
        return { ...campaign, metrics };
      })
    );

    return {
      campaigns: campaignsWithMetrics,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit)
      }
    };
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(businessId, campaignId) {
    const campaign = await Campaign.findOne({ _id: campaignId, businessId }).lean();

    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    // Get real-time metrics from external platforms
    const metrics = await this.getCampaignMetrics(businessId, campaign);

    return { ...campaign, metrics };
  }

  /**
   * Update campaign
   */
  async updateCampaign(businessId, campaignId, updateData) {
    const campaign = await Campaign.findOne({ _id: campaignId, businessId });

    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    if (campaign.status === 'active') {
      throw new ApiError(400, 'Cannot update active campaign. Pause it first.');
    }

    Object.assign(campaign, updateData);
    await campaign.save();

    return campaign;
  }

  /**
   * Launch campaign
   */
  async launchCampaign(businessId, campaignId) {
    const campaign = await Campaign.findOne({ _id: campaignId, businessId });

    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    if (campaign.status === 'active') {
      throw new ApiError(400, 'Campaign is already active');
    }

    // Launch on external platforms
    await this.launchOnExternalPlatforms(campaign);

    campaign.status = 'active';
    campaign.launchedAt = new Date();
    await campaign.save();

    return campaign;
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(businessId, campaignId) {
    const campaign = await Campaign.findOne({ _id: campaignId, businessId });

    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    if (campaign.status !== 'active') {
      throw new ApiError(400, 'Campaign is not active');
    }

    // Pause on external platforms
    await this.pauseOnExternalPlatforms(campaign);

    campaign.status = 'paused';
    await campaign.save();

    return campaign;
  }

  /**
   * Stop campaign
   */
  async stopCampaign(businessId, campaignId) {
    const campaign = await Campaign.findOne({ _id: campaignId, businessId });

    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    // Stop on external platforms
    await this.stopOnExternalPlatforms(campaign);

    campaign.status = 'completed';
    campaign.completedAt = new Date();
    await campaign.save();

    return campaign;
  }

  /**
   * Duplicate campaign
   */
  async duplicateCampaign(businessId, campaignId) {
    const campaign = await Campaign.findOne({ _id: campaignId, businessId });

    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    const campaignData = campaign.toObject();
    delete campaignData._id;
    delete campaignData.createdAt;
    delete campaignData.updatedAt;
    delete campaignData.launchedAt;
    delete campaignData.completedAt;

    campaignData.name = `${campaignData.name} (Copy)`;
    campaignData.status = 'draft';

    const newCampaign = new Campaign({
      ...campaignData,
      businessId
    });

    await newCampaign.save();

    return newCampaign;
  }

  /**
   * Get campaign metrics
   */
  async getCampaignMetrics(businessId, campaign) {
    const metrics = {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0
    };

    try {
      switch (campaign.channel) {
        case 'facebook':
        case 'instagram':
          const fbMetrics = await metaAPI.getCampaignMetrics(
            businessId,
            campaign.externalId
          );
          Object.assign(metrics, fbMetrics);
          break;

        case 'google':
          const googleMetrics = await googleAdsAPI.getCampaignMetrics(
            businessId,
            campaign.externalId
          );
          Object.assign(metrics, googleMetrics);
          break;

        case 'email':
          const emailMetrics = await sendgridAPI.getCampaignMetrics(
            businessId,
            campaign.externalId
          );
          Object.assign(metrics, emailMetrics);
          break;

        case 'sms':
          const smsMetrics = await africastalkingAPI.getCampaignMetrics(
            businessId,
            campaign.externalId
          );
          Object.assign(metrics, smsMetrics);
          break;

        case 'whatsapp':
          const whatsappMetrics = await whatsappBusinessAPI.getCampaignMetrics(
            businessId,
            campaign.externalId
          );
          Object.assign(metrics, whatsappMetrics);
          break;
      }

      return metrics;
    } catch (error) {
      console.error('Failed to fetch campaign metrics:', error);
      return metrics;
    }
  }

  /**
   * Launch on external platforms
   */
  async launchOnExternalPlatforms(campaign) {
    try {
      switch (campaign.channel) {
        case 'facebook':
        case 'instagram':
          const fbResult = await metaAPI.createCampaign(campaign);
          campaign.externalId = fbResult.id;
          campaign.externalUrl = fbResult.url;
          break;

        case 'google':
          const googleResult = await googleAdsAPI.createCampaign(campaign);
          campaign.externalId = googleResult.id;
          break;

        case 'email':
          const emailResult = await sendgridAPI.createCampaign(campaign);
          campaign.externalId = emailResult.id;
          break;

        case 'sms':
          const smsResult = await africastalkingAPI.createCampaign(campaign);
          campaign.externalId = smsResult.id;
          break;

        case 'whatsapp':
          const whatsappResult = await whatsappBusinessAPI.createCampaign(campaign);
          campaign.externalId = whatsappResult.id;
          break;
      }

      await campaign.save();
    } catch (error) {
      throw new ApiError(500, `Failed to launch on ${campaign.channel}: ${error.message}`);
    }
  }

  /**
   * Pause on external platforms
   */
  async pauseOnExternalPlatforms(campaign) {
    try {
      switch (campaign.channel) {
        case 'facebook':
        case 'instagram':
          await metaAPI.pauseCampaign(campaign.externalId);
          break;

        case 'google':
          await googleAdsAPI.pauseCampaign(campaign.externalId);
          break;

        case 'email':
          // Email campaigns can't be paused once sent
          break;

        case 'sms':
          // SMS campaigns can't be paused once sent
          break;
      }
    } catch (error) {
      throw new ApiError(500, `Failed to pause on ${campaign.channel}: ${error.message}`);
    }
  }

  /**
   * Stop on external platforms
   */
  async stopOnExternalPlatforms(campaign) {
    try {
      switch (campaign.channel) {
        case 'facebook':
        case 'instagram':
          await metaAPI.deleteCampaign(campaign.externalId);
          break;

        case 'google':
          await googleAdsAPI.deleteCampaign(campaign.externalId);
          break;
      }
    } catch (error) {
      throw new ApiError(500, `Failed to stop on ${campaign.channel}: ${error.message}`);
    }
  }

  /**
   * Get budget recommendations
   */
  async getBudgetRecommendations(businessId, params) {
    const { channel, goal, audience } = params;

    const recommendations = {
      suggested: 0,
      min: 0,
      max: 0,
      breakdown: {}
    };

    // Base rates by channel (real rates from APIs)
    switch (channel) {
      case 'facebook':
      case 'instagram':
        const fbRates = await metaAPI.getAdRates(audience);
        recommendations.suggested = fbRates.suggestedDaily * 30;
        recommendations.min = fbRates.minDaily * 30;
        recommendations.max = fbRates.maxDaily * 30;
        recommendations.breakdown = fbRates.recommendations;
        break;

      case 'google':
        const googleRates = await googleAdsAPI.getKeywordRates(params.keywords);
        recommendations.suggested = googleRates.suggestedMonthly;
        recommendations.min = googleRates.minMonthly;
        recommendations.max = googleRates.maxMonthly;
        break;

      case 'email':
        recommendations.suggested = 5000; // Email platform costs
        recommendations.min = 2000;
        recommendations.max = 50000;
        break;

      case 'sms':
        const smsRates = await africastalkingAPI.getSMSRates(audience.count);
        recommendations.suggested = smsRates.total;
        recommendations.breakdown = smsRates.perNetwork;
        break;
    }

    // Adjust based on goal
    if (goal === 'awareness') {
      recommendations.suggested *= 1.2;
    } else if (goal === 'conversions') {
      recommendations.suggested *= 1.5;
    }

    return recommendations;
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(businessId, campaignId, period) {
    const campaign = await Campaign.findOne({ _id: campaignId, businessId });

    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    return await campaignAnalytics.getCampaignAnalytics(businessId, campaign, period);
  }

  /**
   * Get campaigns summary
   */
  async getCampaignsSummary(businessId, period) {
    const campaigns = await Campaign.find({ businessId }).lean();

    const summary = {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === 'active').length,
      draft: campaigns.filter(c => c.status === 'draft').length,
      paused: campaigns.filter(c => c.status === 'paused').length,
      completed: campaigns.filter(c => c.status === 'completed').length,
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0
      },
      byChannel: {}
    };

    // Aggregate metrics across all campaigns
    for (const campaign of campaigns) {
      const metrics = await this.getCampaignMetrics(businessId, campaign);
      
      summary.metrics.impressions += metrics.impressions;
      summary.metrics.clicks += metrics.clicks;
      summary.metrics.conversions += metrics.conversions;
      summary.metrics.spend += metrics.spend;
      summary.metrics.revenue += metrics.revenue;

      if (!summary.byChannel[campaign.channel]) {
        summary.byChannel[campaign.channel] = {
          count: 0,
          metrics: { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
        };
      }

      summary.byChannel[campaign.channel].count++;
      summary.byChannel[campaign.channel].metrics.impressions += metrics.impressions;
      summary.byChannel[campaign.channel].metrics.clicks += metrics.clicks;
      summary.byChannel[campaign.channel].metrics.conversions += metrics.conversions;
      summary.byChannel[campaign.channel].metrics.spend += metrics.spend;
      summary.byChannel[campaign.channel].metrics.revenue += metrics.revenue;
    }

    // Calculate derived metrics
    summary.metrics.ctr = summary.metrics.impressions > 0
      ? (summary.metrics.clicks / summary.metrics.impressions) * 100
      : 0;

    summary.metrics.conversionRate = summary.metrics.clicks > 0
      ? (summary.metrics.conversions / summary.metrics.clicks) * 100
      : 0;

    summary.metrics.cpa = summary.metrics.conversions > 0
      ? summary.metrics.spend / summary.metrics.conversions
      : 0;

    summary.metrics.roas = summary.metrics.spend > 0
      ? summary.metrics.revenue / summary.metrics.spend
      : 0;

    return summary;
  }
}

module.exports = new CampaignService();