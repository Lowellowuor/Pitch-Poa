const analyticsEngine = require('../services/analytics-engine.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class DashboardController {
  /**
   * Get main dashboard with all metrics
   * @route GET /api/v1/analytics/dashboard
   */
  getDashboard = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const [
      totalSales,
      totalProfit,
      salesTrending,
      recentSales,
      expensesByCategory,
      expenseTrends,
      channelPerformance,
      businessSnapshot
    ] = await Promise.all([
      analyticsEngine.getTotalSales(businessId, period),
      analyticsEngine.getTotalProfit(businessId, period),
      analyticsEngine.getSalesTrending(businessId, period),
      analyticsEngine.getRecentSales(businessId),
      analyticsEngine.getExpensesByCategory(businessId, period),
      analyticsEngine.getExpenseTrends(businessId, period),
      analyticsEngine.getChannelAnalytics(businessId, period),
      analyticsEngine.getBusinessSnapshot(businessId)
    ]);

    return ApiResponse.success(res, {
      summary: {
        totalSales,
        totalProfit,
        period
      },
      charts: {
        salesTrending,
        expensesByCategory,
        expenseTrends
      },
      tables: {
        recentSales,
        channelPerformance
      },
      snapshot: businessSnapshot
    }, 'Dashboard data retrieved successfully');
  });

  /**
   * Get sales analytics
   * @route GET /api/v1/analytics/sales
   */
  getSalesAnalytics = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d', groupBy = 'day' } = req.query;

    const [totalSales, salesTrending, topProducts] = await Promise.all([
      analyticsEngine.getTotalSales(businessId, period),
      analyticsEngine.getSalesTrending(businessId, period),
      analyticsEngine.getTopProducts(businessId, period)
    ]);

    return ApiResponse.success(res, {
      summary: totalSales,
      trends: salesTrending,
      products: topProducts
    }, 'Sales analytics retrieved');
  });

  /**
   * Get financial analytics
   * @route GET /api/v1/analytics/financial
   */
  getFinancialAnalytics = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = '30d' } = req.query;

    const [profit, expenses, cashflow] = await Promise.all([
      analyticsEngine.getTotalProfit(businessId, period),
      analyticsEngine.getExpensesByCategory(businessId, period),
      analyticsEngine.getCashflowAnalysis(businessId, period)
    ]);

    return ApiResponse.success(res, {
      profit,
      expenses,
      cashflow
    }, 'Financial analytics retrieved');
  });

  /**
   * Get customer analytics
   * @route GET /api/v1/analytics/customers
   */
  getCustomerAnalytics = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const [audience, segments, behavior] = await Promise.all([
      analyticsEngine.getAudienceAnalytics(businessId),
      analyticsEngine.getCustomerSegments(businessId),
      analyticsEngine.getCustomerBehavior(businessId)
    ]);

    return ApiResponse.success(res, {
      audience,
      segments,
      behavior
    }, 'Customer analytics retrieved');
  });

  /**
   * Get product analytics
   * @route GET /api/v1/analytics/products
   */
  getProductAnalytics = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const [performance, inventory, predictions] = await Promise.all([
      analyticsEngine.getProductPerformance(businessId),
      analyticsEngine.getInventoryAnalytics(businessId),
      analyticsEngine.getProductPredictions(businessId)
    ]);

    return ApiResponse.success(res, {
      performance,
      inventory,
      predictions
    }, 'Product analytics retrieved');
  });

  /**
   * Get market analytics (external data)
   * @route GET /api/v1/analytics/market
   */
  getMarketAnalytics = asyncHandler(async (req, res) => {
    const { sector, region } = req.query;

    const [trends, benchmarks, forecast] = await Promise.all([
      analyticsEngine.getMarketTrends(sector, region),
      analyticsEngine.getIndustryBenchmarks(sector),
      analyticsEngine.getMarketForecast(sector, region)
    ]);

    return ApiResponse.success(res, {
      trends,
      benchmarks,
      forecast
    }, 'Market analytics retrieved');
  });

  /**
   * Get predictive analytics
   * @route GET /api/v1/analytics/predictions
   */
  getPredictions = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { horizon = '30d' } = req.query;

    const [salesForecast, demandPrediction, riskAssessment] = await Promise.all([
      analyticsEngine.predictSales(businessId, horizon),
      analyticsEngine.predictDemand(businessId, horizon),
      analyticsEngine.assessRisks(businessId)
    ]);

    return ApiResponse.success(res, {
      salesForecast,
      demandPrediction,
      riskAssessment
    }, 'Predictive analytics retrieved');
  });

  /**
   * Export report
   * @route POST /api/v1/analytics/export
   */
  exportReport = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { format = 'pdf', type = 'full', period = '30d' } = req.body;

    const data = await analyticsEngine.getExportData(businessId, type, period);
    
    // Generate report in requested format
    let report;
    if (format === 'pdf') {
      report = await pdfGenerator.generate(data, type);
    } else if (format === 'excel') {
      report = await excelGenerator.generate(data, type);
    }

    return ApiResponse.success(res, {
      reportUrl: report.url,
      format,
      generatedAt: new Date().toISOString()
    }, 'Report generated successfully');
  });

  /**
   * Get real-time snapshot (Orca-like)
   * @route GET /api/v1/analytics/snapshot
   */
  getSnapshot = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    
    const snapshot = await analyticsEngine.getBusinessSnapshot(businessId);

    return ApiResponse.success(res, snapshot, 'Business snapshot retrieved');
  });
}

module.exports = new DashboardController();