const analyticsEngine = require('../services/analytics-engine.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class CustomerAnalyticsController {
  /**
   * Get customer lifetime value
   * @route GET /api/v1/analytics/customers/ltv
   */
  getCustomerLTV = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { customerId } = req.query;

    const ltv = await analyticsEngine.calculateCustomerLTV(businessId, customerId);
    
    return ApiResponse.success(res, ltv, 'Customer lifetime value retrieved');
  });

  /**
   * Get customer acquisition cost
   * @route GET /api/v1/analytics/customers/cac
   */
  getCustomerAcquisitionCost = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const cac = await analyticsEngine.calculateCustomerAcquisitionCost(businessId, period);
    
    return ApiResponse.success(res, cac, 'Customer acquisition cost retrieved');
  });

  /**
   * Get customer retention rate
   * @route GET /api/v1/analytics/customers/retention
   */
  getRetentionRate = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const retention = await analyticsEngine.calculateRetentionRate(businessId, period);
    
    return ApiResponse.success(res, retention, 'Retention rate retrieved');
  });

  /**
   * Get customer churn rate
   * @route GET /api/v1/analytics/customers/churn
   */
  getChurnRate = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const churn = await analyticsEngine.calculateChurnRate(businessId, period);
    
    return ApiResponse.success(res, churn, 'Churn rate retrieved');
  });

  /**
   * Get customer segmentation
   * @route GET /api/v1/analytics/customers/segments
   */
  getCustomerSegments = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const segments = await analyticsEngine.getCustomerSegments(businessId);
    
    return ApiResponse.success(res, segments, 'Customer segments retrieved');
  });

  /**
   * Get repeat purchase rate
   * @route GET /api/v1/analytics/customers/repeat-rate
   */
  getRepeatPurchaseRate = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const repeatRate = await analyticsEngine.calculateRepeatPurchaseRate(businessId, period);
    
    return ApiResponse.success(res, repeatRate, 'Repeat purchase rate retrieved');
  });

  /**
   * Get customer satisfaction score
   * @route GET /api/v1/analytics/customers/satisfaction
   */
  getSatisfactionScore = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const satisfaction = await analyticsEngine.getCustomerSatisfaction(businessId);
    
    return ApiResponse.success(res, satisfaction, 'Customer satisfaction retrieved');
  });

  /**
   * Get customer demographics
   * @route GET /api/v1/analytics/customers/demographics
   */
  getDemographics = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const demographics = await analyticsEngine.getCustomerDemographics(businessId);
    
    return ApiResponse.success(res, demographics, 'Customer demographics retrieved');
  });

  /**
   * Get top customers
   * @route GET /api/v1/analytics/customers/top
   */
  getTopCustomers = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { limit = 10 } = req.query;

    const topCustomers = await analyticsEngine.getTopCustomers(businessId, parseInt(limit));
    
    return ApiResponse.success(res, topCustomers, 'Top customers retrieved');
  });

  /**
   * Get customer journey analysis
   * @route GET /api/v1/analytics/customers/journey
   */
  getCustomerJourney = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { customerId } = req.query;

    const journey = await analyticsEngine.analyzeCustomerJourney(businessId, customerId);
    
    return ApiResponse.success(res, journey, 'Customer journey retrieved');
  });
}

module.exports = new CustomerAnalyticsController();