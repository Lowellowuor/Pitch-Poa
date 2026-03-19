class CampaignDTO {
  constructor(campaign) {
    this.id = campaign._id;
    this.name = campaign.name;
    this.channel = campaign.channel;
    this.type = campaign.type;
    this.status = campaign.status;
    this.budget = campaign.budget;
    this.schedule = campaign.schedule;
    this.performance = campaign.performance;
    this.roi = campaign.roi;
    this.launchedAt = campaign.launchedAt;
    this.createdAt = campaign.createdAt;
  }

  static fromDocument(campaign) {
    if (!campaign) return null;
    return new CampaignDTO(campaign);
  }

  static fromArray(campaigns) {
    return campaigns.map(c => CampaignDTO.fromDocument(c));
  }
}

class CampaignDetailsDTO extends CampaignDTO {
  constructor(campaign) {
    super(campaign);
    this.description = campaign.description;
    this.targetAudience = campaign.targetAudience;
    this.content = campaign.content;
    this.externalUrl = campaign.externalUrl;
    this.tracking = campaign.tracking;
    this.abTest = campaign.abTest;
    this.remainingBudget = campaign.remainingBudget;
  }
}

class ContentDTO {
  constructor(content) {
    this.id = content._id;
    this.type = content.type;
    this.name = content.name;
    this.channel = content.channel;
    this.headline = content.content?.headline;
    this.body = content.content?.body;
    this.cta = content.content?.cta;
    this.metadata = content.metadata;
    this.tags = content.tags;
    this.createdAt = content.createdAt;
  }
}

class AudienceSegmentDTO {
  constructor(segment) {
    this.id = segment._id;
    this.name = segment.name;
    this.description = segment.description;
    this.size = segment.size;
    this.source = segment.source;
    this.performance = segment.performance;
    this.createdAt = segment.createdAt;
  }
}

class MarketingMetricsDTO {
  constructor(metrics) {
    this.date = metrics.date;
    this.channel = metrics.channel;
    this.impressions = metrics.metrics.impressions;
    this.clicks = metrics.metrics.clicks;
    this.conversions = metrics.metrics.conversions;
    this.spend = metrics.metrics.spend;
    this.revenue = metrics.metrics.revenue;
    this.ctr = metrics.derived.ctr;
    this.conversionRate = metrics.derived.conversionRate;
    this.cpc = metrics.derived.cpc;
    this.cpa = metrics.derived.cpa;
    this.roas = metrics.derived.roas;
  }
}

class MarketingDashboardDTO {
  constructor(data) {
    this.summary = data.summary;
    this.byChannel = data.byChannel;
    this.trends = data.trends;
    this.topCampaigns = data.topCampaigns;
    this.audienceInsights = data.audienceInsights;
    this.recommendations = data.recommendations;
  }
}

module.exports = {
  CampaignDTO,
  CampaignDetailsDTO,
  ContentDTO,
  AudienceSegmentDTO,
  MarketingMetricsDTO,
  MarketingDashboardDTO
};