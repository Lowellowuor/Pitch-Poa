const cashflowService = require('../services/cashflow.service');
const forexApiService = require('../services/external-apis/forex-api.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class CashflowController {
  /**
   * Get cash flow statement
   * @route GET /api/v1/finance/cashflow/statement
   */
  getCashFlowStatement = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate, period = 'monthly' } = req.query;

    const statement = await cashflowService.getCashFlowStatement({
      businessId,
      startDate,
      endDate,
      period
    });

    return ApiResponse.success(res, statement, 'Cash flow statement retrieved');
  });

  /**
   * Get cash flow forecast
   * @route GET /api/v1/finance/cashflow/forecast
   */
  getCashFlowForecast = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { months = 3, includeHistorical = true } = req.query;

    const forecast = await cashflowService.getCashFlowForecast({
      businessId,
      months: parseInt(months),
      includeHistorical: includeHistorical === 'true'
    });

    return ApiResponse.success(res, forecast, 'Cash flow forecast retrieved');
  });

  /**
   * Get cash position
   * @route GET /api/v1/finance/cashflow/position
   */
  getCashPosition = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { asAt, currency = 'KES' } = req.query;

    const position = await cashflowService.getCashPosition({
      businessId,
      asAt,
      currency
    });

    // Convert to requested currency if needed
    if (currency !== 'KES') {
      const rate = await forexApiService.getExchangeRate('KES', currency);
      position.total = position.total * rate;
      position.byAccount = position.byAccount.map(acc => ({
        ...acc,
        balance: acc.balance * rate,
        convertedCurrency: currency,
        exchangeRate: rate
      }));
    }

    return ApiResponse.success(res, position, 'Cash position retrieved');
  });

  /**
   * Get cash flow projections
   * @route GET /api/v1/finance/cashflow/projections
   */
  getCashFlowProjections = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { months = 6, scenario = 'normal' } = req.query;

    const projections = await cashflowService.getCashFlowProjections({
      businessId,
      months: parseInt(months),
      scenario // normal, optimistic, pessimistic
    });

    return ApiResponse.success(res, projections, 'Cash flow projections retrieved');
  });

  /**
   * Get cash flow by category
   * @route GET /api/v1/finance/cashflow/by-category
   */
  getCashFlowByCategory = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const byCategory = await cashflowService.getCashFlowByCategory({
      businessId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, byCategory, 'Cash flow by category retrieved');
  });

  /**
   * Get cash flow trends
   * @route GET /api/v1/finance/cashflow/trends
   */
  getCashFlowTrends = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { months = 12 } = req.query;

    const trends = await cashflowService.getCashFlowTrends(businessId, parseInt(months));

    return ApiResponse.success(res, trends, 'Cash flow trends retrieved');
  });

  /**
   * Get working capital analysis
   * @route GET /api/v1/finance/cashflow/working-capital
   */
  getWorkingCapital = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { asAt } = req.query;

    const analysis = await cashflowService.getWorkingCapitalAnalysis(businessId, asAt);

    return ApiResponse.success(res, analysis, 'Working capital analysis retrieved');
  });

  /**
   * Get cash conversion cycle
   * @route GET /api/v1/finance/cashflow/conversion-cycle
   */
  getCashConversionCycle = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period } = req.query;

    const cycle = await cashflowService.getCashConversionCycle(businessId, period);

    return ApiResponse.success(res, cycle, 'Cash conversion cycle retrieved');
  });

  /**
   * Get burn rate
   * @route GET /api/v1/finance/cashflow/burn-rate
   */
  getBurnRate = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { months = 3 } = req.query;

    const burnRate = await cashflowService.getBurnRate(businessId, parseInt(months));

    return ApiResponse.success(res, burnRate, 'Burn rate retrieved');
  });

  /**
   * Get runway analysis
   * @route GET /api/v1/finance/cashflow/runway
   */
  getRunwayAnalysis = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const runway = await cashflowService.getRunwayAnalysis(businessId);

    return ApiResponse.success(res, runway, 'Runway analysis retrieved');
  });

  /**
   * Create cash flow budget
   * @route POST /api/v1/finance/cashflow/budget
   */
  createCashFlowBudget = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const budgetData = req.body;

    const budget = await cashflowService.createCashFlowBudget(businessId, budgetData);

    return ApiResponse.created(res, budget, 'Cash flow budget created');
  });

  /**
   * Get cash flow budget vs actual
   * @route GET /api/v1/finance/cashflow/budget-vs-actual
   */
  getBudgetVsActual = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { budgetId, period } = req.query;

    const comparison = await cashflowService.getBudgetVsActual({
      businessId,
      budgetId,
      period
    });

    return ApiResponse.success(res, comparison, 'Budget vs actual retrieved');
  });

  /**
   * Get cash flow alerts
   * @route GET /api/v1/finance/cashflow/alerts
   */
  getCashFlowAlerts = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const alerts = await cashflowService.getCashFlowAlerts(businessId);

    return ApiResponse.success(res, alerts, 'Cash flow alerts retrieved');
  });

  /**
   * Configure cash flow alerts
   * @route POST /api/v1/finance/cashflow/alert-config
   */
  configureAlerts = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const config = req.body;

    const alertConfig = await cashflowService.configureAlerts(businessId, config);

    return ApiResponse.success(res, alertConfig, 'Alert configuration saved');
  });

  /**
   * Get cash flow ratios
   * @route GET /api/v1/finance/cashflow/ratios
   */
  getCashFlowRatios = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period } = req.query;

    const ratios = await cashflowService.getCashFlowRatios(businessId, period);

    return ApiResponse.success(res, ratios, 'Cash flow ratios retrieved');
  });

  /**
   * Get cash flow by source/use
   * @route GET /api/v1/finance/cashflow/source-use
   */
  getCashFlowSourceUse = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const analysis = await cashflowService.getCashFlowSourceUse({
      businessId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, analysis, 'Cash flow source and use analysis retrieved');
  });

  /**
   * Get cash flow by business unit
   * @route GET /api/v1/finance/cashflow/by-unit
   */
  getCashFlowByUnit = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const byUnit = await cashflowService.getCashFlowByUnit({
      businessId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, byUnit, 'Cash flow by business unit retrieved');
  });

  /**
   * Get cash flow by project
   * @route GET /api/v1/finance/cashflow/by-project/:projectId
   */
  getCashFlowByProject = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    const cashflow = await cashflowService.getCashFlowByProject({
      businessId,
      projectId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, cashflow, 'Cash flow by project retrieved');
  });

  /**
   * Get cash flow by department
   * @route GET /api/v1/finance/cashflow/by-department/:departmentId
   */
  getCashFlowByDepartment = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { departmentId } = req.params;
    const { startDate, endDate } = req.query;

    const cashflow = await cashflowService.getCashFlowByDepartment({
      businessId,
      departmentId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, cashflow, 'Cash flow by department retrieved');
  });

  /**
   * Get cash flow by location
   * @route GET /api/v1/finance/cashflow/by-location/:locationId
   */
  getCashFlowByLocation = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { locationId } = req.params;
    const { startDate, endDate } = req.query;

    const cashflow = await cashflowService.getCashFlowByLocation({
      businessId,
      locationId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, cashflow, 'Cash flow by location retrieved');
  });

  /**
   * Get cash flow by currency
   * @route GET /api/v1/finance/cashflow/by-currency
   */
  getCashFlowByCurrency = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const byCurrency = await cashflowService.getCashFlowByCurrency({
      businessId,
      startDate,
      endDate
    });

    // Get current exchange rates
    const currencies = [...new Set(byCurrency.map(item => item.currency))];
    const rates = {};
    for (const currency of currencies) {
      if (currency !== 'KES') {
        rates[currency] = await forexApiService.getExchangeRate(currency, 'KES');
      }
    }

    return ApiResponse.success(res, {
      byCurrency,
      exchangeRates: rates,
      totalInKES: byCurrency.reduce((sum, item) => {
        const rate = item.currency === 'KES' ? 1 : rates[item.currency] || 1;
        return sum + (item.netCashFlow * rate);
      }, 0)
    }, 'Cash flow by currency retrieved');
  });

  /**
   * Get cash flow sensitivity analysis
   * @route GET /api/v1/finance/cashflow/sensitivity
   */
  getSensitivityAnalysis = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { variable, range } = req.query;

    const analysis = await cashflowService.getSensitivityAnalysis({
      businessId,
      variable,
      range: range ? JSON.parse(range) : [-20, -10, 0, 10, 20]
    });

    return ApiResponse.success(res, analysis, 'Sensitivity analysis retrieved');
  });

  /**
   * Get cash flow scenario analysis
   * @route GET /api/v1/finance/cashflow/scenarios
   */
  getScenarioAnalysis = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const scenarios = await cashflowService.getScenarioAnalysis(businessId);

    return ApiResponse.success(res, scenarios, 'Scenario analysis retrieved');
  });

  /**
   * Get cash flow drivers
   * @route GET /api/v1/finance/cashflow/drivers
   */
  getCashFlowDrivers = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period } = req.query;

    const drivers = await cashflowService.getCashFlowDrivers(businessId, period);

    return ApiResponse.success(res, drivers, 'Cash flow drivers retrieved');
  });

  /**
   * Get cash flow quality analysis
   * @route GET /api/v1/finance/cashflow/quality
   */
  getCashFlowQuality = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period } = req.query;

    const quality = await cashflowService.getCashFlowQuality(businessId, period);

    return ApiResponse.success(res, quality, 'Cash flow quality analysis retrieved');
  });

  /**
   * Get cash flow forecasting accuracy
   * @route GET /api/v1/finance/cashflow/forecast-accuracy
   */
  getForecastAccuracy = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { months = 6 } = req.query;

    const accuracy = await cashflowService.getForecastAccuracy(businessId, parseInt(months));

    return ApiResponse.success(res, accuracy, 'Forecast accuracy retrieved');
  });

  /**
   * Get cash flow by payment method
   * @route GET /api/v1/finance/cashflow/by-payment-method
   */
  getCashFlowByPaymentMethod = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const byMethod = await cashflowService.getCashFlowByPaymentMethod({
      businessId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, byMethod, 'Cash flow by payment method retrieved');
  });

  /**
   * Get cash flow by customer segment
   * @route GET /api/v1/finance/cashflow/by-customer-segment
   */
  getCashFlowByCustomerSegment = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const bySegment = await cashflowService.getCashFlowByCustomerSegment({
      businessId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, bySegment, 'Cash flow by customer segment retrieved');
  });

  /**
   * Get cash flow by supplier
   * @route GET /api/v1/finance/cashflow/by-supplier/:supplierId
   */
  getCashFlowBySupplier = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { supplierId } = req.params;
    const { startDate, endDate } = req.query;

    const cashflow = await cashflowService.getCashFlowBySupplier({
      businessId,
      supplierId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, cashflow, 'Cash flow by supplier retrieved');
  });

  /**
   * Get cash flow dashboard
   * @route GET /api/v1/finance/cashflow/dashboard
   */
  getCashFlowDashboard = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const dashboard = await cashflowService.getCashFlowDashboard(businessId);

    return ApiResponse.success(res, dashboard, 'Cash flow dashboard retrieved');
  });

  /**
   * Export cash flow report
   * @route GET /api/v1/finance/cashflow/export
   */
  exportCashFlowReport = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { format, startDate, endDate, type = 'statement' } = req.query;

    const export_ = await cashflowService.exportCashFlowReport({
      businessId,
      format,
      startDate,
      endDate,
      type
    });

    res.setHeader('Content-Type', export_.contentType);
    res.setHeader('Content-Disposition', `attachment; filename=cashflow-${type}.${format}`);
    res.send(export_.data);
  });

  /**
   * Get cash flow recommendations
   * @route GET /api/v1/finance/cashflow/recommendations
   */
  getRecommendations = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const recommendations = await cashflowService.getRecommendations(businessId);

    return ApiResponse.success(res, recommendations, 'Cash flow recommendations retrieved');
  });

  /**
   * Get cash flow benchmark
   * @route GET /api/v1/finance/cashflow/benchmark
   */
  getBenchmark = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { industry } = req.query;

    const benchmark = await cashflowService.getBenchmark({
      businessId,
      industry: industry || req.user.business?.industry
    });

    return ApiResponse.success(res, benchmark, 'Cash flow benchmark retrieved');
  });

  /**
   * Get cash flow volatility
   * @route GET /api/v1/finance/cashflow/volatility
   */
  getVolatility = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { months = 12 } = req.query;

    const volatility = await cashflowService.getVolatility(businessId, parseInt(months));

    return ApiResponse.success(res, volatility, 'Cash flow volatility retrieved');
  });

  /**
   * Get cash flow seasonality
   * @route GET /api/v1/finance/cashflow/seasonality
   */
  getSeasonality = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const seasonality = await cashflowService.getSeasonality(businessId);

    return ApiResponse.success(res, seasonality, 'Cash flow seasonality retrieved');
  });

  /**
   * Get cash flow cycle breakdown
   * @route GET /api/v1/finance/cashflow/cycle-breakdown
   */
  getCycleBreakdown = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period } = req.query;

    const breakdown = await cashflowService.getCycleBreakdown(businessId, period);

    return ApiResponse.success(res, breakdown, 'Cash flow cycle breakdown retrieved');
  });

  /**
   * Get cash flow sustainability index
   * @route GET /api/v1/finance/cashflow/sustainability
   */
  getSustainabilityIndex = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const index = await cashflowService.getSustainabilityIndex(businessId);

    return ApiResponse.success(res, index, 'Cash flow sustainability index retrieved');
  });

  /**
   * Get cash flow stress test
   * @route POST /api/v1/finance/cashflow/stress-test
   */
  runStressTest = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { scenarios } = req.body;

    const results = await cashflowService.runStressTest({
      businessId,
      scenarios
    });

    return ApiResponse.success(res, results, 'Stress test completed');
  });

  /**
   * Get cash flow optimization suggestions
   * @route GET /api/v1/finance/cashflow/optimizations
   */
  getOptimizationSuggestions = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const suggestions = await cashflowService.getOptimizationSuggestions(businessId);

    return ApiResponse.success(res, suggestions, 'Optimization suggestions retrieved');
  });
}

module.exports = new CashflowController();