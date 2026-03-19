const analyticsEngine = require('../services/analytics-engine.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class ProductAnalyticsController {
  /**
   * Get product performance
   * @route GET /api/v1/analytics/products/performance
   */
  getProductPerformance = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const performance = await analyticsEngine.getProductPerformance(businessId, period);
    
    return ApiResponse.success(res, performance, 'Product performance retrieved');
  });

  /**
   * Get inventory analytics
   * @route GET /api/v1/analytics/products/inventory
   */
  getInventoryAnalytics = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const inventory = await analyticsEngine.getInventoryAnalytics(businessId);
    
    return ApiResponse.success(res, inventory, 'Inventory analytics retrieved');
  });

  /**
   * Get stock turnover rate
   * @route GET /api/v1/analytics/products/turnover
   */
  getStockTurnover = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const turnover = await analyticsEngine.calculateStockTurnover(businessId, period);
    
    return ApiResponse.success(res, turnover, 'Stock turnover rate retrieved');
  });

  /**
   * Get low stock alerts
   * @route GET /api/v1/analytics/products/low-stock
   */
  getLowStockAlerts = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { threshold = 10 } = req.query;

    const alerts = await analyticsEngine.getLowStockAlerts(businessId, parseInt(threshold));
    
    return ApiResponse.success(res, alerts, 'Low stock alerts retrieved');
  });

  /**
   * Get best selling products
   * @route GET /api/v1/analytics/products/best-sellers
   */
  getBestSellers = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d', limit = 10 } = req.query;

    const bestSellers = await analyticsEngine.getBestSellers(businessId, period, parseInt(limit));
    
    return ApiResponse.success(res, bestSellers, 'Best selling products retrieved');
  });

  /**
   * Get slow moving products
   * @route GET /api/v1/analytics/products/slow-moving
   */
  getSlowMovingProducts = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d', threshold = 5 } = req.query;

    const slowMoving = await analyticsEngine.getSlowMovingProducts(businessId, period, parseInt(threshold));
    
    return ApiResponse.success(res, slowMoving, 'Slow moving products retrieved');
  });

  /**
   * Get product profitability
   * @route GET /api/v1/analytics/products/profitability
   */
  getProductProfitability = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const profitability = await analyticsEngine.getProductProfitability(businessId, period);
    
    return ApiResponse.success(res, profitability, 'Product profitability retrieved');
  });

  /**
   * Get product recommendations based on analytics
   * @route GET /api/v1/analytics/products/recommendations
   */
  getProductRecommendations = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const recommendations = await analyticsEngine.generateProductRecommendations(businessId);
    
    return ApiResponse.success(res, recommendations, 'Product recommendations retrieved');
  });

  /**
   * Get price optimization suggestions
   * @route GET /api/v1/analytics/products/price-optimization
   */
  getPriceOptimization = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { productId } = req.query;

    const optimization = await analyticsEngine.optimizeProductPrice(businessId, productId);
    
    return ApiResponse.success(res, optimization, 'Price optimization retrieved');
  });
}

module.exports = new ProductAnalyticsController();