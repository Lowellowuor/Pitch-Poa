const analyticsEngine = require('../services/analytics-engine.service');
const realtimeMetrics = require('../services/realtime-metrics.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class SalesAnalyticsController {
  /**
   * Get real-time sales metrics
   * @route GET /api/v1/analytics/sales/realtime
   */
  getRealtimeSales = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    
    const metrics = await realtimeMetrics.getSalesMetrics(businessId);
    
    return ApiResponse.success(res, metrics, 'Real-time sales metrics retrieved');
  });

  /**
   * Get sales by channel
   * @route GET /api/v1/analytics/sales/by-channel
   */
  getSalesByChannel = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const channelData = await analyticsEngine.getSalesByChannel(businessId, period);
    
    return ApiResponse.success(res, channelData, 'Sales by channel retrieved');
  });

  /**
   * Get sales by product
   * @route GET /api/v1/analytics/sales/by-product
   */
  getSalesByProduct = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d', limit = 10 } = req.query;

    const productData = await analyticsEngine.getTopProducts(businessId, period, parseInt(limit));
    
    return ApiResponse.success(res, productData, 'Sales by product retrieved');
  });

  /**
   * Get sales by time of day
   * @route GET /api/v1/analytics/sales/by-hour
   */
  getSalesByHour = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const hourlyData = await analyticsEngine.getSalesByHour(businessId, period);
    
    return ApiResponse.success(res, hourlyData, 'Sales by hour retrieved');
  });

  /**
   * Get sales by day of week
   * @route GET /api/v1/analytics/sales/by-day
   */
  getSalesByDay = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const dailyData = await analyticsEngine.getSalesByDayOfWeek(businessId, period);
    
    return ApiResponse.success(res, dailyData, 'Sales by day retrieved');
  });

  /**
   * Get sales comparison (period over period)
   * @route GET /api/v1/analytics/sales/compare
   */
  getSalesComparison = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { currentPeriod = '30d', previousPeriod = '30d' } = req.query;

    const comparison = await analyticsEngine.compareSalesPeriods(
      businessId, 
      currentPeriod, 
      previousPeriod
    );
    
    return ApiResponse.success(res, comparison, 'Sales comparison retrieved');
  });

  /**
   * Get sales forecast
   * @route GET /api/v1/analytics/sales/forecast
   */
  getSalesForecast = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { horizon = '30d' } = req.query;

    const forecast = await analyticsEngine.predictSales(businessId, horizon);
    
    return ApiResponse.success(res, forecast, 'Sales forecast retrieved');
  });

  /**
   * Get conversion rates
   * @route GET /api/v1/analytics/sales/conversion
   */
  getConversionRates = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const conversion = await analyticsEngine.getConversionRates(businessId, period);
    
    return ApiResponse.success(res, conversion, 'Conversion rates retrieved');
  });
}

module.exports = new SalesAnalyticsController();