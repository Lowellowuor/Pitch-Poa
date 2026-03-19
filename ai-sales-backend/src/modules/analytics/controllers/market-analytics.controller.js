const analyticsEngine = require('../services/analytics-engine.service');
const knbsAPI = require('../services/external-apis/knbs-economic-api.service');
const centralBankAPI = require('../services/external-apis/central-bank-api.service');
const weatherAPI = require('../services/external-apis/weather-api.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class MarketAnalyticsController {
  /**
   * Get market trends from KNBS
   * @route GET /api/v1/analytics/market/trends
   */
  getMarketTrends = asyncHandler(async (req, res) => {
    const { sector, region } = req.query;

    const [trends, economicData] = await Promise.all([
      analyticsEngine.getMarketTrends(sector, region),
      knbsAPI.getSectorPerformance(sector)
    ]);

    return ApiResponse.success(res, {
      trends,
      economicData
    }, 'Market trends retrieved');
  });

  /**
   * Get industry benchmarks
   * @route GET /api/v1/analytics/market/benchmarks
   */
  getIndustryBenchmarks = asyncHandler(async (req, res) => {
    const { sector } = req.query;

    const benchmarks = await analyticsEngine.getIndustryBenchmarks(sector);
    
    return ApiResponse.success(res, benchmarks, 'Industry benchmarks retrieved');
  });

  /**
   * Get competitor analysis
   * @route GET /api/v1/analytics/market/competitors
   */
  getCompetitorAnalysis = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { radius = 5 } = req.query;

    const competitors = await analyticsEngine.analyzeCompetitors(businessId, parseInt(radius));
    
    return ApiResponse.success(res, competitors, 'Competitor analysis retrieved');
  });

  /**
   * Get market size estimation
   * @route GET /api/v1/analytics/market/size
   */
  getMarketSize = asyncHandler(async (req, res) => {
    const { sector, region } = req.query;

    const marketSize = await analyticsEngine.estimateMarketSize(sector, region);
    
    return ApiResponse.success(res, marketSize, 'Market size estimation retrieved');
  });

  /**
   * Get economic indicators
   * @route GET /api/v1/analytics/market/economic
   */
  getEconomicIndicators = asyncHandler(async (req, res) => {
    const [gdp, inflation, interest] = await Promise.all([
      knbsAPI.getGDPData(),
      centralBankAPI.getInflationRates(),
      centralBankAPI.getInterestRates()
    ]);

    return ApiResponse.success(res, {
      gdp,
      inflation,
      interest
    }, 'Economic indicators retrieved');
  });

  /**
   * Get weather impact on sales
   * @route GET /api/v1/analytics/market/weather-impact
   */
  getWeatherImpact = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { lat, lon } = req.query;

    const [weather, salesImpact] = await Promise.all([
      weatherAPI.getForecast(lat, lon),
      analyticsEngine.analyzeWeatherImpact(businessId, lat, lon)
    ]);

    return ApiResponse.success(res, {
      weather,
      salesImpact
    }, 'Weather impact analysis retrieved');
  });

  /**
   * Get seasonal trends
   * @route GET /api/v1/analytics/market/seasonal
   */
  getSeasonalTrends = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const seasonal = await analyticsEngine.analyzeSeasonalTrends(businessId);
    
    return ApiResponse.success(res, seasonal, 'Seasonal trends retrieved');
  });

  /**
   * Get market forecast
   * @route GET /api/v1/analytics/market/forecast
   */
  getMarketForecast = asyncHandler(async (req, res) => {
    const { sector, region, horizon = '12m' } = req.query;

    const forecast = await analyticsEngine.forecastMarketGrowth(sector, region, horizon);
    
    return ApiResponse.success(res, forecast, 'Market forecast retrieved');
  });
}

module.exports = new MarketAnalyticsController();