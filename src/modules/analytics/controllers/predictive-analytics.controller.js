const analyticsEngine = require('../services/analytics-engine.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class PredictiveAnalyticsController {
  /**
   * Predict sales for next period
   * @route GET /api/v1/analytics/predictive/sales
   */
  predictSales = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { horizon = '30d', model = 'arima' } = req.query;

    const prediction = await analyticsEngine.predictSales(businessId, horizon, model);
    
    return ApiResponse.success(res, prediction, 'Sales prediction retrieved');
  });

  /**
   * Predict demand for products
   * @route GET /api/v1/analytics/predictive/demand
   */
  predictDemand = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { productId, horizon = '30d' } = req.query;

    const demand = await analyticsEngine.predictDemand(businessId, productId, horizon);
    
    return ApiResponse.success(res, demand, 'Demand prediction retrieved');
  });

  /**
   * Predict customer churn
   * @route GET /api/v1/analytics/predictive/churn
   */
  predictChurn = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const churn = await analyticsEngine.predictCustomerChurn(businessId);
    
    return ApiResponse.success(res, churn, 'Churn prediction retrieved');
  });

  /**
   * Identify upsell opportunities
   * @route GET /api/v1/analytics/predictive/upsell
   */
  getUpsellOpportunities = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const opportunities = await analyticsEngine.identifyUpsellOpportunities(businessId);
    
    return ApiResponse.success(res, opportunities, 'Upsell opportunities retrieved');
  });

  /**
   * Predict optimal inventory levels
   * @route GET /api/v1/analytics/predictive/inventory
   */
  predictOptimalInventory = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const inventory = await analyticsEngine.predictOptimalInventory(businessId);
    
    return ApiResponse.success(res, inventory, 'Optimal inventory prediction retrieved');
  });

  /**
   * Predict cash flow
   * @route GET /api/v1/analytics/predictive/cashflow
   */
  predictCashflow = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { horizon = '30d' } = req.query;

    const cashflow = await analyticsEngine.predictCashflow(businessId, horizon);
    
    return ApiResponse.success(res, cashflow, 'Cash flow prediction retrieved');
  });

  /**
   * Identify risk factors
   * @route GET /api/v1/analytics/predictive/risks
   */
  identifyRisks = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const risks = await analyticsEngine.assessBusinessRisks(businessId);
    
    return ApiResponse.success(res, risks, 'Risk assessment retrieved');
  });

  /**
   * Predict customer lifetime value
   * @route GET /api/v1/analytics/predictive/ltv
   */
  predictLTV = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { customerId } = req.query;

    const ltv = await analyticsEngine.predictLTV(businessId, customerId);
    
    return ApiResponse.success(res, ltv, 'LTV prediction retrieved');
  });
}

module.exports = new PredictiveAnalyticsController();