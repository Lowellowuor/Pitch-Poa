const Joi = require('joi');

// Analytics query parameters validation
const analyticsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('today', 'week', 'month', 'quarter', 'year', 'all')
    .default('month'),
  
  startDate: Joi.date().iso()
    .when('period', { is: 'custom', then: Joi.required() }),
  
  endDate: Joi.date().iso()
    .when('period', { is: 'custom', then: Joi.required() }),
  
  interval: Joi.string()
    .valid('hour', 'day', 'week', 'month')
    .default('day'),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(100),
  
  offset: Joi.number()
    .integer()
    .min(0)
    .default(0)
});

// Sales analytics specific validation
const salesAnalyticsSchema = Joi.object({
  groupBy: Joi.string()
    .valid('product', 'channel', 'customer', 'hour', 'day')
    .optional(),
  
  channel: Joi.string()
    .valid('direct', 'whatsapp', 'facebook', 'instagram', 'website', 'mpesa')
    .optional(),
  
  productId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
});

// Financial analytics validation
const financialAnalyticsSchema = Joi.object({
  includeTax: Joi.boolean().default(true),
  currency: Joi.string().valid('KES', 'USD').default('KES'),
  category: Joi.string().optional()
});

// Customer analytics validation
const customerAnalyticsSchema = Joi.object({
  segment: Joi.string()
    .valid('vip', 'regular', 'occasional', 'new', 'at-risk')
    .optional(),
  
  minSpent: Joi.number().min(0).optional(),
  minTransactions: Joi.number().integer().min(1).optional()
});

// Product analytics validation
const productAnalyticsSchema = Joi.object({
  category: Joi.string().optional(),
  stockStatus: Joi.string()
    .valid('in-stock', 'low-stock', 'out-of-stock')
    .optional(),
  
  sortBy: Joi.string()
    .valid('revenue', 'quantity', 'profit', 'turnover')
    .default('revenue')
});

// Predictive analytics validation
const predictiveAnalyticsSchema = Joi.object({
  horizon: Joi.string()
    .valid('7d', '30d', '90d', '1y')
    .default('30d'),
  
  model: Joi.string()
    .valid('arima', 'prophet', 'lstm', 'ensemble')
    .default('ensemble'),
  
  confidence: Joi.number()
    .min(0.5)
    .max(0.99)
    .default(0.95)
});

// Report export validation
const reportExportSchema = Joi.object({
  type: Joi.string()
    .valid('sales', 'financial', 'customers', 'products', 'full')
    .required(),
  
  format: Joi.string()
    .valid('pdf', 'excel')
    .default('pdf'),
  
  period: Joi.string()
    .valid('today', 'week', 'month', 'quarter', 'year', 'all')
    .default('month'),
  
  email: Joi.string()
    .email()
    .optional()
});

// Scheduled report validation
const scheduledReportSchema = Joi.object({
  type: Joi.string()
    .valid('sales', 'financial', 'customers', 'products', 'full')
    .required(),
  
  schedule: Joi.string()
    .valid('daily', 'weekly', 'monthly')
    .required(),
  
  format: Joi.string()
    .valid('pdf', 'excel')
    .default('pdf'),
  
  email: Joi.string()
    .email()
    .required(),
  
  recipients: Joi.array()
    .items(Joi.string().email())
    .optional()
});

module.exports = {
  analyticsQuerySchema,
  salesAnalyticsSchema,
  financialAnalyticsSchema,
  customerAnalyticsSchema,
  productAnalyticsSchema,
  predictiveAnalyticsSchema,
  reportExportSchema,
  scheduledReportSchema
};