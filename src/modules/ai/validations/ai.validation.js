const Joi = require('joi');

// Custom ObjectId validation
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Sales prediction validation schema
 */
const predictionSchema = Joi.object({
  productId: Joi.string()
    .pattern(objectIdPattern)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid product ID format',
    }),
  
  timeRange: Joi.string()
    .valid('7d', '30d', '90d', '1y')
    .default('30d')
    .messages({
      'any.only': 'Time range must be one of: 7d, 30d, 90d, 1y',
    }),
  
  includeHistory: Joi.boolean()
    .default(true),
  
  granularity: Joi.string()
    .valid('daily', 'weekly', 'monthly')
    .default('daily')
    .when('timeRange', {
      is: '7d',
      then: Joi.valid('daily').default('daily'),
    }),
});

/**
 * Product recommendations validation schema
 */
const recommendationSchema = Joi.object({
  customerId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Invalid customer ID format',
      'any.required': 'Customer ID is required',
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 50',
    }),
  
  category: Joi.string()
    .optional()
    .max(50),
  
  excludeViewed: Joi.boolean()
    .default(true),
  
  sortBy: Joi.string()
    .valid('relevance', 'price', 'popularity')
    .default('relevance'),
});

/**
 * Price optimization validation schema
 */
const optimizationSchema = Joi.object({
  productId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Invalid product ID format',
      'any.required': 'Product ID is required',
    }),
  
  targetMargin: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Target margin cannot be negative',
      'number.max': 'Target margin cannot exceed 100%',
    }),
  
  competitorPrices: Joi.array()
    .items(
      Joi.object({
        competitor: Joi.string().required(),
        price: Joi.number().positive().required(),
        timestamp: Joi.date().iso(),
      })
    )
    .optional(),
  
  seasonality: Joi.boolean()
    .default(true),
  
  marketConditions: Joi.object({
    demand: Joi.string().valid('low', 'medium', 'high'),
    supply: Joi.string().valid('low', 'medium', 'high'),
    trends: Joi.array().items(Joi.string()),
  }).optional(),
});

/**
 * Customer analysis validation schema
 */
const analysisSchema = Joi.object({
  customerId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Invalid customer ID format',
      'any.required': 'Customer ID is required',
    }),
  
  period: Joi.string()
    .valid('7d', '30d', '90d', '1y', 'all')
    .default('30d'),
  
  includePredictions: Joi.boolean()
    .default(false),
  
  metrics: Joi.array()
    .items(
      Joi.string().valid(
        'purchases',
        'browsing',
        'cart',
        'returns',
        'reviews'
      )
    )
    .default(['purchases', 'browsing']),
});

/**
 * Inventory prediction validation schema
 */
const inventorySchema = Joi.object({
  productIds: Joi.array()
    .items(Joi.string().pattern(objectIdPattern))
    .min(1)
    .max(100)
    .optional()
    .messages({
      'array.min': 'At least one product ID is required',
      'array.max': 'Cannot exceed 100 products per request',
    }),
  
  forecastDays: Joi.number()
    .integer()
    .min(7)
    .max(180)
    .default(30)
    .messages({
      'number.min': 'Forecast days must be at least 7',
      'number.max': 'Forecast days cannot exceed 180',
    }),
  
  reorderPoint: Joi.number()
    .integer()
    .min(0)
    .optional(),
  
  includeHistorical: Joi.boolean()
    .default(true),
  
  stockAlert: Joi.boolean()
    .default(true),
});

/**
 * Market trends validation schema
 */
const trendsSchema = Joi.object({
  category: Joi.string()
    .optional()
    .max(50),
  
  region: Joi.string()
    .optional()
    .max(50),
  
  period: Joi.string()
    .valid('7d', '30d', '90d', '1y')
    .default('30d'),
  
  includeForecast: Joi.boolean()
    .default(true),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
});

/**
 * Demand forecast validation schema
 */
const forecastSchema = Joi.object({
  products: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().pattern(objectIdPattern).required(),
        currentStock: Joi.number().integer().min(0).optional(),
        price: Joi.number().positive().optional(),
      })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one product is required',
      'array.max': 'Cannot forecast more than 50 products at once',
    }),
  
  forecastPeriod: Joi.number()
    .integer()
    .min(7)
    .max(365)
    .default(30),
  
  includeSeasonal: Joi.boolean()
    .default(true),
  
  confidenceLevel: Joi.number()
    .min(0.5)
    .max(0.99)
    .default(0.95),
  
  factors: Joi.array()
    .items(
      Joi.string().valid(
        'seasonality',
        'trend',
        'promotions',
        'competition',
        'economy'
      )
    )
    .default(['seasonality', 'trend']),
});

module.exports = {
  predictionSchema,
  recommendationSchema,
  optimizationSchema,
  analysisSchema,
  inventorySchema,
  trendsSchema,
  forecastSchema,
};