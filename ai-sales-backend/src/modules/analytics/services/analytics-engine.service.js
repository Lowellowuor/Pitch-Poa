const SalesAnalytics = require('../models/sales-metrics.model');
const CustomerInsights = require('../models/customer-insights.model');
const centralBankAPI = require('./external-apis/central-bank-api.service');
const knbsAPI = require('./external-apis/knbs-economic-api.service');
const mpesaAPI = require('./external-apis/mpesa-api.service');

class AnalyticsEngineService {
  /**
   * Calculate total sales from real transaction data
   */
  async getTotalSales(businessId, period = 'all') {
    try {
      const query = { businessId };
      
      if (period !== 'all') {
        query.date = this.getDateRange(period);
      }

      const result = await SalesAnalytics.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: '$quantity' },
            average: { $avg: '$amount' }
          }
        }
      ]);

      return {
        total: result[0]?.total || 0,
        transactionCount: result[0]?.count || 0,
        averageTransaction: result[0]?.average || 0,
        currency: 'KES'
      };
    } catch (error) {
      console.error('Total Sales Error:', error);
      throw new Error('Failed to calculate total sales');
    }
  }

  /**
   * Calculate total profit (real P&L)
   */
  async getTotalProfit(businessId, period = 'all') {
    try {
      const query = { businessId };
      
      if (period !== 'all') {
        query.date = this.getDateRange(period);
      }

      const sales = await SalesAnalytics.find(query).lean();
      
      let totalRevenue = 0;
      let totalCost = 0;

      for (const sale of sales) {
        totalRevenue += sale.amount;
        totalCost += sale.costOfGoods || 0;
      }

      const profit = totalRevenue - totalCost;
      const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      return {
        revenue: totalRevenue,
        cost: totalCost,
        profit,
        margin: parseFloat(margin.toFixed(2)),
        currency: 'KES'
      };
    } catch (error) {
      throw new Error('Failed to calculate profit');
    }
  }

  /**
   * Get sales trending analysis
   */
  async getSalesTrending(businessId, period = '30d') {
    try {
      const query = { businessId };
      query.date = this.getDateRange(period);

      const trends = await SalesAnalytics.aggregate([
        { $match: query },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      // Calculate growth rate
      const growthRate = await this.calculateGrowthRate(trends);

      return {
        daily: trends,
        growthRate,
        period,
        total: trends.reduce((sum, day) => sum + day.total, 0)
      };
    } catch (error) {
      throw new Error('Failed to get sales trends');
    }
  }

  /**
   * Get recent sales with real-time data
   */
  async getRecentSales(businessId, limit = 10) {
    try {
      const sales = await SalesAnalytics.find({ businessId })
        .sort({ date: -1 })
        .limit(limit)
        .lean();

      // Enrich with M-PESA data if available
      for (const sale of sales) {
        if (sale.mpesaReference) {
          const mpesaData = await mpesaAPI.getTransaction(sale.mpesaReference);
          sale.mpesaDetails = mpesaData;
        }
      }

      return sales;
    } catch (error) {
      throw new Error('Failed to fetch recent sales');
    }
  }

  /**
   * Get total expenses by category
   */
  async getExpensesByCategory(businessId, period = '30d') {
    try {
      const query = { businessId };
      query.date = this.getDateRange(period);

      const expenses = await SalesAnalytics.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$expenseCategory',
            total: { $sum: '$expenseAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]);

      return expenses.map(e => ({
        category: e._id || 'Uncategorized',
        total: e.total,
        count: e.count,
        percentage: await this.calculateCategoryPercentage(e.total, query)
      }));
    } catch (error) {
      throw new Error('Failed to get expenses by category');
    }
  }

  /**
   * Get expense trends over time
   */
  async getExpenseTrends(businessId, period = '30d') {
    try {
      const query = { businessId };
      query.date = this.getDateRange(period);

      const trends = await SalesAnalytics.aggregate([
        { $match: query },
        {
          $group: {
            _id: { 
              date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              category: '$expenseCategory'
            },
            total: { $sum: '$expenseAmount' }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);

      // Format for charting
      const formatted = {};
      trends.forEach(t => {
        if (!formatted[t._id.date]) {
          formatted[t._id.date] = {};
        }
        formatted[t._id.date][t._id.category] = t.total;
      });

      return {
        daily: formatted,
        categories: [...new Set(trends.map(t => t._id.category))]
      };
    } catch (error) {
      throw new Error('Failed to get expense trends');
    }
  }

  /**
   * Get script/product performance analytics
   */
  async getScriptAnalytics(businessId, scriptId = null) {
    try {
      const query = { businessId };
      if (scriptId) query.scriptId = scriptId;

      const analytics = await SalesAnalytics.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$scriptId',
            scriptName: { $first: '$scriptName' },
            uses: { $sum: 1 },
            conversions: { $sum: { $cond: ['$converted', 1, 0] } },
            totalRevenue: { $sum: '$amount' },
            averageDeal: { $avg: '$amount' }
          }
        },
        {
          $addFields: {
            conversionRate: { 
              $multiply: [{ $divide: ['$conversions', '$uses'] }, 100] 
            }
          }
        },
        { $sort: { uses: -1 } }
      ]);

      return analytics;
    } catch (error) {
      throw new Error('Failed to get script analytics');
    }
  }

  /**
   * Get target audience analytics
   */
  async getAudienceAnalytics(businessId) {
    try {
      const insights = await CustomerInsights.find({ businessId }).lean();

      const analytics = {
        demographics: await this.getDemographicBreakdown(insights),
        behavior: await this.getBehaviorPatterns(insights),
        preferences: await this.getPreferenceAnalysis(insights),
        segments: await this.getCustomerSegments(insights)
      };

      return analytics;
    } catch (error) {
      throw new Error('Failed to get audience analytics');
    }
  }

  /**
   * Get channel performance analytics
   */
  async getChannelAnalytics(businessId, period = '30d') {
    try {
      const query = { businessId };
      query.date = this.getDateRange(period);

      const channels = await SalesAnalytics.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$channel',
            totalRevenue: { $sum: '$amount' },
            transactions: { $sum: 1 },
            customers: { $addToSet: '$customerId' }
          }
        },
        {
          $addFields: {
            averageOrderValue: { $divide: ['$totalRevenue', '$transactions'] },
            uniqueCustomers: { $size: '$customers' }
          }
        }
      ]);

      return channels.map(c => ({
        channel: c._id || 'Direct',
        revenue: c.totalRevenue,
        transactions: c.transactions,
        customers: c.uniqueCustomers,
        averageOrder: c.averageOrderValue
      }));
    } catch (error) {
      throw new Error('Failed to get channel analytics');
    }
  }

  /**
   * Get real-time business snapshot (like Orca)
   */
  async getBusinessSnapshot(businessId) {
    try {
      const [sales, profit, recent, expenses, trends] = await Promise.all([
        this.getTotalSales(businessId, 'today'),
        this.getTotalProfit(businessId, 'today'),
        this.getRecentSales(businessId, 5),
        this.getExpensesByCategory(businessId, 'today'),
        this.getSalesTrending(businessId, '7d')
      ]);

      return {
        snapshot: {
          date: new Date().toISOString(),
          salesToday: sales.total,
          profitToday: profit.profit,
          marginToday: profit.margin,
          transactionsToday: sales.transactionCount
        },
        recentActivity: recent,
        expenses: expenses,
        trends: trends,
        healthScore: await this.calculateBusinessHealth(businessId)
      };
    } catch (error) {
      throw new Error('Failed to get business snapshot');
    }
  }

  /**
   * Calculate business health score
   */
  async calculateBusinessHealth(businessId) {
    try {
      const [
        profitMargin,
        salesGrowth,
        customerRetention,
        expenseRatio
      ] = await Promise.all([
        this.getProfitMargin(businessId),
        this.getSalesGrowth(businessId),
        this.getCustomerRetention(businessId),
        this.getExpenseRatio(businessId)
      ]);

      let score = 0;
      score += profitMargin * 30;
      score += salesGrowth * 30;
      score += customerRetention * 20;
      score += (1 - expenseRatio) * 20;

      return {
        score: Math.min(100, Math.max(0, score)),
        components: {
          profitMargin,
          salesGrowth,
          customerRetention,
          expenseRatio
        }
      };
    } catch (error) {
      return { score: 0, error: 'Unable to calculate health score' };
    }
  }

  /**
   * Get date range helper
   */
  getDateRange(period) {
    const now = new Date();
    const ranges = {
      'today': { $gte: new Date(now.setHours(0,0,0,0)) },
      'week': { $gte: new Date(now.setDate(now.getDate() - 7)) },
      'month': { $gte: new Date(now.setMonth(now.getMonth() - 1)) },
      'quarter': { $gte: new Date(now.setMonth(now.getMonth() - 3)) },
      'year': { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) }
    };
    return ranges[period] || ranges.month;
  }

  /**
   * Calculate growth rate from trends
   */
  async calculateGrowthRate(trends) {
    if (trends.length < 2) return 0;
    
    const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
    const secondHalf = trends.slice(Math.floor(trends.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.total, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.total, 0) / secondHalf.length;
    
    return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  }

  /**
   * Calculate category percentage
   */
  async calculateCategoryPercentage(categoryTotal, query) {
    const total = await SalesAnalytics.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$expenseAmount' } } }
    ]);
    
    return total[0]?.total > 0 ? (categoryTotal / total[0].total) * 100 : 0;
  }

  /**
   * Get demographic breakdown
   */
  async getDemographicBreakdown(insights) {
    const demographics = {};
    
    insights.forEach(i => {
      if (i.demographics) {
        Object.entries(i.demographics).forEach(([key, value]) => {
          if (!demographics[key]) demographics[key] = {};
          demographics[key][value] = (demographics[key][value] || 0) + 1;
        });
      }
    });

    return demographics;
  }

  /**
   * Get behavior patterns
   */
  async getBehaviorPatterns(insights) {
    return {
      peakHours: await this.analyzePeakHours(insights),
      purchaseFrequency: await this.analyzeFrequency(insights),
      averageBasketSize: await this.calculateBasketSize(insights)
    };
  }

  /**
   * Get preference analysis
   */
  async getPreferenceAnalysis(insights) {
    const preferences = {};
    
    insights.forEach(i => {
      if (i.preferences) {
        Object.entries(i.preferences).forEach(([key, value]) => {
          if (!preferences[key]) preferences[key] = {};
          preferences[key][value] = (preferences[key][value] || 0) + 1;
        });
      }
    });

    return preferences;
  }

  /**
   * Get customer segments
   */
  async getCustomerSegments(insights) {
    const segments = {
      vip: [],
      regular: [],
      occasional: [],
      new: [],
      atRisk: []
    };

    insights.forEach(i => {
      const score = i.loyaltyScore || 0;
      const lastPurchase = i.lastPurchaseDate ? new Date(i.lastPurchaseDate) : null;
      const daysSinceLastPurchase = lastPurchase ? 
        (Date.now() - lastPurchase) / (1000 * 60 * 60 * 24) : 999;

      if (score > 80) segments.vip.push(i);
      else if (score > 50) segments.regular.push(i);
      else if (score > 20) segments.occasional.push(i);
      else if (i.isNew) segments.new.push(i);
      
      if (daysSinceLastPurchase > 60) segments.atRisk.push(i);
    });

    return segments;
  }
}

module.exports = new AnalyticsEngineService();