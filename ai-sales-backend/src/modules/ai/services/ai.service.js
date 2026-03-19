const axios = require('axios');
const config = require('../../../config/environment');
const logger = require('../../../shared/utils/logger');

// Custom API Error
class AIServiceError extends Error {
  constructor(message, statusCode = 503) {
    super(message);
    this.name = 'AIServiceError';
    this.statusCode = statusCode;
  }
}

/**
 * AI Service - Handles all communication with external AI API
 */
class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: config.AI_SERVICE_API_URL,
      timeout: config.AI_SERVICE_TIMEOUT || 30000,
      headers: {
        'Authorization': `Bearer ${config.AI_SERVICE_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Service-Name': 'ai-sales-backend',
        'X-Service-Version': process.env.npm_package_version || '1.0.0',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (request) => {
        logger.debug('AI Service Request', {
          url: request.url,
          method: request.method,
          timestamp: new Date().toISOString(),
        });
        return request;
      },
      (error) => {
        logger.error('AI Service Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('AI Service Response', {
          url: response.config.url,
          status: response.status,
          duration: Date.now() - (response.config.metadata?.startTime || Date.now()),
        });
        return response;
      },
      (error) => {
        logger.error('AI Service Response Error', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get sales predictions
   */
  async getSalesPredictions(vendorId, productId = null, timeRange = '30d', includeHistory = true) {
    try {
      const response = await this.client.post('/predict/sales', {
        vendorId,
        productId,
        timeRange,
        includeHistory,
        timestamp: new Date().toISOString(),
      });

      return this._formatPredictionResponse(response.data);
    } catch (error) {
      this._handleError(error, 'sales prediction');
    }
  }

  /**
   * Get product recommendations
   */
  async getProductRecommendations(customerId, limit = 10, category = null, excludeViewed = true) {
    try {
      const response = await this.client.get('/recommendations/products', {
        params: {
          customerId,
          limit,
          category,
          excludeViewed,
        },
      });

      return this._formatRecommendationsResponse(response.data);
    } catch (error) {
      this._handleError(error, 'product recommendations');
    }
  }

  /**
   * Get pricing optimization
   */
  async getPricingOptimization(productId, options, vendorId) {
    try {
      const response = await this.client.post('/optimize/price', {
        productId,
        vendorId,
        ...options,
        timestamp: new Date().toISOString(),
      });

      return this._formatOptimizationResponse(response.data);
    } catch (error) {
      this._handleError(error, 'pricing optimization');
    }
  }

  /**
   * Analyze customer behavior
   */
  async analyzeCustomerBehavior(customerId, period = '30d', includePredictions = false, vendorId) {
    try {
      const response = await this.client.get('/analyze/customer', {
        params: {
          customerId,
          period,
          includePredictions,
          vendorId,
        },
      });

      return this._formatAnalysisResponse(response.data);
    } catch (error) {
      this._handleError(error, 'customer analysis');
    }
  }

  /**
   * Get inventory predictions
   */
  async getInventoryPredictions(vendorId, productIds = [], forecastDays = 30, reorderPoint = null) {
    try {
      const response = await this.client.post('/predict/inventory', {
        vendorId,
        productIds: productIds.length ? productIds : undefined,
        forecastDays,
        reorderPoint,
        timestamp: new Date().toISOString(),
      });

      return this._formatInventoryResponse(response.data);
    } catch (error) {
      this._handleError(error, 'inventory prediction');
    }
  }

  /**
   * Get market trends
   */
  async getMarketTrends(category = null, region = null, period = '30d', vendorId) {
    try {
      const response = await this.client.get('/analyze/trends', {
        params: {
          category,
          region,
          period,
          vendorId,
        },
      });

      return this._formatTrendsResponse(response.data);
    } catch (error) {
      this._handleError(error, 'market trends');
    }
  }

  /**
   * Get demand forecast
   */
  async getDemandForecast(vendorId, products = [], forecastPeriod = 30, includeSeasonal = true) {
    try {
      const response = await this.client.post('/forecast/demand', {
        vendorId,
        products,
        forecastPeriod,
        includeSeasonal,
        timestamp: new Date().toISOString(),
      });

      return this._formatForecastResponse(response.data);
    } catch (error) {
      this._handleError(error, 'demand forecast');
    }
  }

  /**
   * Format prediction response
   */
  _formatPredictionResponse(data) {
    return {
      predictions: data.predictions || [],
      confidence: data.confidence || 0,
      factors: data.factors || [],
      recommendations: data.recommendations || [],
      metadata: {
        modelVersion: data.modelVersion,
        generatedAt: data.timestamp || new Date().toISOString(),
      },
    };
  }

  /**
   * Format recommendations response
   */
  _formatRecommendationsResponse(data) {
    return {
      recommendations: data.recommendations || [],
      totalCount: data.totalCount || 0,
      relevanceScore: data.relevanceScore || 0,
      metadata: {
        algorithm: data.algorithm,
        generatedAt: data.timestamp || new Date().toISOString(),
      },
    };
  }

  /**
   * Format optimization response
   */
  _formatOptimizationResponse(data) {
    return {
      suggestedPrice: data.suggestedPrice,
      priceRange: data.priceRange || { min: 0, max: 0 },
      confidence: data.confidence || 0,
      factors: data.factors || [],
      expectedImpact: data.expectedImpact || {},
      metadata: {
        modelVersion: data.modelVersion,
        generatedAt: data.timestamp || new Date().toISOString(),
      },
    };
  }

  /**
   * Format analysis response
   */
  _formatAnalysisResponse(data) {
    return {
      customerProfile: data.customerProfile || {},
      behavior: data.behavior || [],
      preferences: data.preferences || {},
      predictions: data.predictions || {},
      insights: data.insights || [],
      metadata: {
        analysisPeriod: data.period,
        generatedAt: data.timestamp || new Date().toISOString(),
      },
    };
  }

  /**
   * Format inventory response
   */
  _formatInventoryResponse(data) {
    return {
      predictions: data.predictions || [],
      reorderAlerts: data.reorderAlerts || [],
      stockoutRisk: data.stockoutRisk || [],
      optimalOrder: data.optimalOrder || [],
      metadata: {
        forecastDays: data.forecastDays,
        generatedAt: data.timestamp || new Date().toISOString(),
      },
    };
  }

  /**
   * Format trends response
   */
  _formatTrendsResponse(data) {
    return {
      trends: data.trends || [],
      seasonality: data.seasonality || {},
      emergingProducts: data.emergingProducts || [],
      insights: data.insights || [],
      metadata: {
        period: data.period,
        generatedAt: data.timestamp || new Date().toISOString(),
      },
    };
  }

  /**
   * Format forecast response
   */
  _formatForecastResponse(data) {
    return {
      forecast: data.forecast || [],
      confidence: data.confidence || [],
      factors: data.factors || [],
      recommendations: data.recommendations || [],
      metadata: {
        forecastPeriod: data.forecastPeriod,
        includeSeasonal: data.includeSeasonal,
        generatedAt: data.timestamp || new Date().toISOString(),
      },
    };
  }

  /**
   * Handle AI service errors
   */
  _handleError(error, operation) {
    logger.error(`AI Service ${operation} failed`, {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response) {
      // The request was made and the server responded with a status code
      throw new AIServiceError(
        error.response.data?.message || `AI service ${operation} failed`,
        error.response.status
      );
    } else if (error.request) {
      // The request was made but no response was received
      throw new AIServiceError(
        `AI service unavailable. No response received for ${operation}`,
        503
      );
    } else {
      // Something happened in setting up the request
      throw new AIServiceError(
        `AI service request failed for ${operation}: ${error.message}`,
        500
      );
    }
  }
}

module.exports = new AIService();