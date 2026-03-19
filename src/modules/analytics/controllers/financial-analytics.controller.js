const analyticsEngine = require('../services/analytics-engine.service');
const centralBankAPI = require('../services/external-apis/central-bank-api.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class FinancialAnalyticsController {
  /**
   * Get profit & loss statement
   * @route GET /api/v1/analytics/financial/pnl
   */
  getProfitLoss = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const pnl = await analyticsEngine.getProfitLoss(businessId, period);
    
    return ApiResponse.success(res, pnl, 'Profit & loss statement retrieved');
  });

  /**
   * Get cash flow analysis
   * @route GET /api/v1/analytics/financial/cashflow
   */
  getCashFlow = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const cashflow = await analyticsEngine.getCashflowAnalysis(businessId, period);
    
    return ApiResponse.success(res, cashflow, 'Cash flow analysis retrieved');
  });

  /**
   * Get expense breakdown
   * @route GET /api/v1/analytics/financial/expenses
   */
  getExpenses = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d', category } = req.query;

    const expenses = await analyticsEngine.getExpenseBreakdown(businessId, period, category);
    
    return ApiResponse.success(res, expenses, 'Expense breakdown retrieved');
  });

  /**
   * Get revenue analysis
   * @route GET /api/v1/analytics/financial/revenue
   */
  getRevenueAnalysis = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const revenue = await analyticsEngine.getRevenueAnalysis(businessId, period);
    
    return ApiResponse.success(res, revenue, 'Revenue analysis retrieved');
  });

  /**
   * Get margin analysis
   * @route GET /api/v1/analytics/financial/margins
   */
  getMarginAnalysis = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const margins = await analyticsEngine.getMarginAnalysis(businessId, period);
    
    return ApiResponse.success(res, margins, 'Margin analysis retrieved');
  });

  /**
   * Get financial ratios
   * @route GET /api/v1/analytics/financial/ratios
   */
  getFinancialRatios = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const ratios = await analyticsEngine.getFinancialRatios(businessId, period);
    
    return ApiResponse.success(res, ratios, 'Financial ratios retrieved');
  });

  /**
   * Get exchange rate impact (with CBK data)
   * @route GET /api/v1/analytics/financial/exchange-impact
   */
  getExchangeRateImpact = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    
    // Get real exchange rates from CBK
    const exchangeRates = await centralBankAPI.getExchangeRates();
    
    // Calculate impact on business
    const impact = await analyticsEngine.calculateExchangeRateImpact(businessId, exchangeRates);
    
    return ApiResponse.success(res, {
      exchangeRates,
      impact
    }, 'Exchange rate impact retrieved');
  });

  /**
   * Get tax liability estimate
   * @route GET /api/v1/analytics/financial/tax-estimate
   */
  getTaxEstimate = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = 'year' } = req.query;

    const taxEstimate = await analyticsEngine.estimateTaxLiability(businessId, period);
    
    return ApiResponse.success(res, taxEstimate, 'Tax estimate retrieved');
  });
}

module.exports = new FinancialAnalyticsController();