const aiService = require('../services/ai.service');
const { ApiError } = require('../../../shared/middlewares/auth');
const logger = require('../../../shared/utils/logger');

/**
 * Format success response
 */
const successResponse = (res, data, message = 'Success') => {
  res.status(200).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * AI Controller - Handles all AI-related requests
 */
class AIController {
  /**
   * Get sales predictions
   * @route POST /api/v1/ai/predict/sales
   */
  async getSalesPredictions(req, res, next) {
    try {
      const { productId, timeRange, includeHistory } = req.body;
      const vendorId = req.user.id;

      logger.info('Sales prediction requested', {
        vendorId,
        productId,
        timeRange,
      });

      const predictions = await aiService.getSalesPredictions(
        vendorId,
        productId,
        timeRange,
        includeHistory
      );

      return successResponse(
        res,
        predictions,
        'Sales predictions generated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product recommendations
   * @route GET /api/v1/ai/recommendations/products
   */
  async getProductRecommendations(req, res, next) {
    try {
      const { customerId, limit = 10, category, excludeViewed } = req.query;

      logger.info('Product recommendations requested', {
        customerId,
        limit,
        category,
      });

      const recommendations = await aiService.getProductRecommendations(
        customerId,
        parseInt(limit),
        category,
        excludeViewed === 'true'
      );

      return successResponse(
        res,
        recommendations,
        'Product recommendations generated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pricing optimization
   * @route POST /api/v1/ai/optimize/price
   */
  async getPricingOptimization(req, res, next) {
    try {
      const { productId, targetMargin, competitorPrices, seasonality } = req.body;
      const vendorId = req.user.id;

      logger.info('Pricing optimization requested', {
        vendorId,
        productId,
        targetMargin,
      });

      const optimization = await aiService.getPricingOptimization(
        productId,
        {
          targetMargin,
          competitorPrices,
          seasonality,
        },
        vendorId
      );

      return successResponse(
        res,
        optimization,
        'Price optimization completed successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze customer behavior
   * @route GET /api/v1/ai/analyze/customer/:customerId
   */
  async analyzeCustomerBehavior(req, res, next) {
    try {
      const { customerId } = req.params;
      const { period = '30d', includePredictions } = req.query;
      const vendorId = req.user.id;

      logger.info('Customer behavior analysis requested', {
        vendorId,
        customerId,
        period,
      });

      const analysis = await aiService.analyzeCustomerBehavior(
        customerId,
        period,
        includePredictions === 'true',
        vendorId
      );

      return successResponse(
        res,
        analysis,
        'Customer behavior analysis completed successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get inventory predictions
   * @route POST /api/v1/ai/predict/inventory
   */
  async getInventoryPredictions(req, res, next) {
    try {
      const { productIds, forecastDays, reorderPoint } = req.body;
      const vendorId = req.user.id;

      logger.info('Inventory prediction requested', {
        vendorId,
        productCount: productIds?.length,
        forecastDays,
      });

      const predictions = await aiService.getInventoryPredictions(
        vendorId,
        productIds,
        forecastDays,
        reorderPoint
      );

      return successResponse(
        res,
        predictions,
        'Inventory predictions generated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get market trends analysis
   * @route GET /api/v1/ai/analyze/trends
   */
  async getMarketTrends(req, res, next) {
    try {
      const { category, region, period } = req.query;
      const vendorId = req.user.id;

      logger.info('Market trends analysis requested', {
        vendorId,
        category,
        region,
      });

      const trends = await aiService.getMarketTrends(
        category,
        region,
        period,
        vendorId
      );

      return successResponse(
        res,
        trends,
        'Market trends analysis completed successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get demand forecasting
   * @route POST /api/v1/ai/forecast/demand
   */
  async getDemandForecast(req, res, next) {
    try {
      const { products, forecastPeriod, includeSeasonal } = req.body;
      const vendorId = req.user.id;

      logger.info('Demand forecast requested', {
        vendorId,
        productCount: products?.length,
        forecastPeriod,
      });

      const forecast = await aiService.getDemandForecast(
        vendorId,
        products,
        forecastPeriod,
        includeSeasonal
      );

      return successResponse(
        res,
        forecast,
        'Demand forecast generated successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AIController();