const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const salesController = require('../controllers/sales-analytics.controller');
const financialController = require('../controllers/financial-analytics.controller');
const customerController = require('../controllers/customer-analytics.controller');
const productController = require('../controllers/product-analytics.controller');
const marketController = require('../controllers/market-analytics.controller');
const predictiveController = require('../controllers/predictive-analytics.controller');

const { authenticate, authorize } = require('../../../shared/middlewares/auth');
const validate = require('../../../shared/middlewares/validate');
const {
  analyticsQuerySchema,
  salesAnalyticsSchema,
  financialAnalyticsSchema,
  customerAnalyticsSchema,
  productAnalyticsSchema,
  predictiveAnalyticsSchema,
  reportExportSchema,
  scheduledReportSchema
} = require('../validations/analytics.validation');
const { USER_ROLES } = require('../../../config/constants');

// All analytics routes require authentication
router.use(authenticate);

// ==================== DASHBOARD ROUTES ====================

router.get('/dashboard',
  validate(analyticsQuerySchema, 'query'),
  dashboardController.getDashboard
);

router.get('/snapshot',
  dashboardController.getSnapshot
);

// ==================== SALES ANALYTICS ====================

router.get('/sales/realtime',
  salesController.getRealtimeSales
);

router.get('/sales/by-channel',
  validate(analyticsQuerySchema, 'query'),
  salesController.getSalesByChannel
);

router.get('/sales/by-product',
  validate(analyticsQuerySchema, 'query'),
  salesController.getSalesByProduct
);

router.get('/sales/by-hour',
  validate(analyticsQuerySchema, 'query'),
  salesController.getSalesByHour
);

router.get('/sales/by-day',
  validate(analyticsQuerySchema, 'query'),
  salesController.getSalesByDay
);

router.get('/sales/compare',
  validate(analyticsQuerySchema, 'query'),
  salesController.getSalesComparison
);

router.get('/sales/forecast',
  validate(predictiveAnalyticsSchema, 'query'),
  salesController.getSalesForecast
);

router.get('/sales/conversion',
  validate(analyticsQuerySchema, 'query'),
  salesController.getConversionRates
);

// ==================== FINANCIAL ANALYTICS ====================

router.get('/financial/pnl',
  validate(analyticsQuerySchema, 'query'),
  financialController.getProfitLoss
);

router.get('/financial/cashflow',
  validate(analyticsQuerySchema, 'query'),
  financialController.getCashFlow
);

router.get('/financial/expenses',
  validate(analyticsQuerySchema, 'query'),
  financialController.getExpenses
);

router.get('/financial/revenue',
  validate(analyticsQuerySchema, 'query'),
  financialController.getRevenueAnalysis
);

router.get('/financial/margins',
  validate(analyticsQuerySchema, 'query'),
  financialController.getMarginAnalysis
);

router.get('/financial/ratios',
  validate(analyticsQuerySchema, 'query'),
  financialController.getFinancialRatios
);

router.get('/financial/exchange-impact',
  financialController.getExchangeRateImpact
);

router.get('/financial/tax-estimate',
  validate(analyticsQuerySchema, 'query'),
  financialController.getTaxEstimate
);

// ==================== CUSTOMER ANALYTICS ====================

router.get('/customers/ltv',
  validate(customerAnalyticsSchema, 'query'),
  customerController.getCustomerLTV
);

router.get('/customers/cac',
  validate(analyticsQuerySchema, 'query'),
  customerController.getCustomerAcquisitionCost
);

router.get('/customers/retention',
  validate(analyticsQuerySchema, 'query'),
  customerController.getRetentionRate
);

router.get('/customers/churn',
  validate(analyticsQuerySchema, 'query'),
  customerController.getChurnRate
);

router.get('/customers/segments',
  customerController.getCustomerSegments
);

router.get('/customers/repeat-rate',
  validate(analyticsQuerySchema, 'query'),
  customerController.getRepeatPurchaseRate
);

router.get('/customers/satisfaction',
  customerController.getSatisfactionScore
);

router.get('/customers/demographics',
  customerController.getDemographics
);

router.get('/customers/top',
  customerController.getTopCustomers
);

router.get('/customers/journey',
  customerController.getCustomerJourney
);

// ==================== PRODUCT ANALYTICS ====================

router.get('/products/performance',
  validate(analyticsQuerySchema, 'query'),
  productController.getProductPerformance
);

router.get('/products/inventory',
  productController.getInventoryAnalytics
);

router.get('/products/turnover',
  validate(analyticsQuerySchema, 'query'),
  productController.getStockTurnover
);

router.get('/products/low-stock',
  productController.getLowStockAlerts
);

router.get('/products/best-sellers',
  validate(analyticsQuerySchema, 'query'),
  productController.getBestSellers
);

router.get('/products/slow-moving',
  validate(analyticsQuerySchema, 'query'),
  productController.getSlowMovingProducts
);

router.get('/products/profitability',
  validate(analyticsQuerySchema, 'query'),
  productController.getProductProfitability
);

router.get('/products/recommendations',
  productController.getProductRecommendations
);

router.get('/products/price-optimization',
  productController.getPriceOptimization
);

// ==================== MARKET ANALYTICS (ADMIN ONLY) ====================

router.get('/market/trends',
  authorize(USER_ROLES.ADMIN),
  marketController.getMarketTrends
);

router.get('/market/benchmarks',
  authorize(USER_ROLES.ADMIN),
  marketController.getIndustryBenchmarks
);

router.get('/market/competitors',
  authorize(USER_ROLES.ADMIN),
  marketController.getCompetitorAnalysis
);

router.get('/market/size',
  authorize(USER_ROLES.ADMIN),
  marketController.getMarketSize
);

router.get('/market/economic',
  authorize(USER_ROLES.ADMIN),
  marketController.getEconomicIndicators
);

router.get('/market/weather-impact',
  authorize(USER_ROLES.ADMIN),
  marketController.getWeatherImpact
);

router.get('/market/seasonal',
  authorize(USER_ROLES.ADMIN),
  marketController.getSeasonalTrends
);

router.get('/market/forecast',
  authorize(USER_ROLES.ADMIN),
  marketController.getMarketForecast
);

// ==================== PREDICTIVE ANALYTICS ====================

router.get('/predictive/sales',
  validate(predictiveAnalyticsSchema, 'query'),
  predictiveController.predictSales
);

router.get('/predictive/demand',
  validate(predictiveAnalyticsSchema, 'query'),
  predictiveController.predictDemand
);

router.get('/predictive/churn',
  authorize(USER_ROLES.ADMIN),
  predictiveController.predictChurn
);

router.get('/predictive/upsell',
  predictiveController.getUpsellOpportunities
);

router.get('/predictive/inventory',
  predictiveController.predictOptimalInventory
);

router.get('/predictive/cashflow',
  validate(predictiveAnalyticsSchema, 'query'),
  predictiveController.predictCashflow
);

router.get('/predictive/risks',
  authorize(USER_ROLES.ADMIN),
  predictiveController.identifyRisks
);

router.get('/predictive/ltv',
  validate(customerAnalyticsSchema, 'query'),
  predictiveController.predictLTV
);

// ==================== REPORTS ====================

router.post('/reports/export',
  validate(reportExportSchema),
  dashboardController.exportReport
);

router.post('/reports/schedule',
  authorize(USER_ROLES.ADMIN),
  validate(scheduledReportSchema),
  dashboardController.scheduleReport
);

module.exports = router;