const SalesMetrics = require('../models/sales-metrics.model');
const mpesaAPI = require('./external-apis/mpesa-api.service');
const socialMetricsAPI = require('./external-apis/social-metrics-api.service');

class RealtimeMetricsService {
  /**
   * Get real-time sales metrics
   */
  async getSalesMetrics(businessId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's sales from database
      const todaySales = await SalesMetrics.aggregate([
        {
          $match: {
            businessId: mongoose.Types.ObjectId(businessId),
            date: { $gte: today }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            mpesaTotal: {
              $sum: {
                $cond: [{ $eq: ['$paymentMethod', 'mpesa'] }, '$amount', 0]
              }
            }
          }
        }
      ]);

      // Get M-PESA real-time balance
      const mpesaBalance = await mpesaAPI.getAccountBalance(process.env.MPESA_SHORTCODE);

      // Get recent transactions
      const recentTransactions = await SalesMetrics.find({
        businessId,
        date: { $gte: new Date(Date.now() - 3600000) } // Last hour
      })
        .sort({ date: -1 })
        .limit(10)
        .lean();

      return {
        today: {
          sales: todaySales[0]?.total || 0,
          transactions: todaySales[0]?.count || 0,
          mpesaSales: todaySales[0]?.mpesaTotal || 0
        },
        mpesaBalance: mpesaBalance.balance,
        recentTransactions,
        lastUpdated: new Date().toISOString(),
        currentHour: new Date().getHours()
      };
    } catch (error) {
      console.error('Realtime Metrics Error:', error);
      throw new Error('Failed to fetch real-time metrics');
    }
  }

  /**
   * Get real-time social media metrics
   */
  async getSocialMetrics(businessId, socialAccounts) {
    try {
      const metrics = {};

      for (const account of socialAccounts) {
        switch (account.platform) {
          case 'facebook':
            metrics.facebook = await socialMetricsAPI.getFacebookInsights(account.pageId);
            break;
          case 'instagram':
            metrics.instagram = await socialMetricsAPI.getInstagramInsights(account.instagramId);
            break;
          case 'twitter':
            metrics.twitter = await socialMetricsAPI.getTwitterAnalytics(account.username);
            break;
          case 'whatsapp':
            metrics.whatsapp = await socialMetricsAPI.getWhatsAppAnalytics(account.phoneNumberId);
            break;
        }
      }

      return metrics;
    } catch (error) {
      throw new Error('Failed to fetch social metrics');
    }
  }

  /**
   * Get real-time inventory status
   */
  async getInventoryStatus(businessId) {
    try {
      const lowStock = await SalesMetrics.aggregate([
        {
          $match: {
            businessId: mongoose.Types.ObjectId(businessId)
          }
        },
        {
          $group: {
            _id: '$productId',
            productName: { $first: '$productName' },
            totalSold: { $sum: '$quantity' },
            lastSale: { $max: '$date' }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $match: {
            'product.stock': { $lt: 10 }
          }
        }
      ]);

      return {
        lowStockItems: lowStock,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Failed to fetch inventory status');
    }
  }

  /**
   * Get real-time customer activity
   */
  async getCustomerActivity(businessId) {
    try {
      const activeCustomers = await SalesMetrics.aggregate([
        {
          $match: {
            businessId: mongoose.Types.ObjectId(businessId),
            date: { $gte: new Date(Date.now() - 3600000) } // Last hour
          }
        },
        {
          $group: {
            _id: '$customerId',
            customerName: { $first: '$customerName' },
            lastActivity: { $max: '$date' },
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { amount: -1 } },
        { $limit: 10 }
      ]);

      return {
        activeCustomers,
        count: activeCustomers.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Failed to fetch customer activity');
    }
  }

  /**
   * Get real-time alerts
   */
  async getAlerts(businessId) {
    const alerts = [];

    try {
      // Check for unusual activity
      const unusualActivity = await this.detectUnusualActivity(businessId);
      if (unusualActivity) alerts.push(unusualActivity);

      // Check for low stock
      const lowStock = await this.getInventoryStatus(businessId);
      lowStock.lowStockItems.forEach(item => {
        alerts.push({
          type: 'LOW_STOCK',
          severity: 'WARNING',
          message: `${item.productName} is running low on stock`,
          timestamp: new Date().toISOString()
        });
      });

      // Check for payment issues
      const paymentIssues = await this.detectPaymentIssues(businessId);
      if (paymentIssues) alerts.push(paymentIssues);

      return alerts;
    } catch (error) {
      throw new Error('Failed to generate alerts');
    }
  }

  /**
   * Detect unusual activity
   */
  async detectUnusualActivity(businessId) {
    // Calculate average hourly sales
    const hourlyAvg = await SalesMetrics.aggregate([
      {
        $match: {
          businessId: mongoose.Types.ObjectId(businessId),
          date: { $gte: new Date(Date.now() - 24 * 3600000) }
        }
      },
      {
        $group: {
          _id: { $hour: '$date' },
          avg: { $avg: '$amount' }
        }
      }
    ]);

    // Get current hour sales
    const currentHour = new Date().getHours();
    const currentHourSales = await SalesMetrics.aggregate([
      {
        $match: {
          businessId: mongoose.Types.ObjectId(businessId),
          date: { $gte: new Date(Date.now() - 3600000) }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const currentTotal = currentHourSales[0]?.total || 0;
    const avgForHour = hourlyAvg.find(h => h._id === currentHour)?.avg || 0;

    if (avgForHour > 0 && currentTotal > avgForHour * 2) {
      return {
        type: 'UNUSUAL_ACTIVITY',
        severity: 'INFO',
        message: `Unusually high sales activity: ${currentTotal} KES vs avg ${avgForHour} KES`,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Detect payment issues
   */
  async detectPaymentIssues(businessId) {
    const failedPayments = await SalesMetrics.countDocuments({
      businessId,
      status: 'failed',
      date: { $gte: new Date(Date.now() - 3600000) }
    });

    if (failedPayments > 5) {
      return {
        type: 'PAYMENT_ISSUES',
        severity: 'CRITICAL',
        message: `${failedPayments} failed payments in the last hour`,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }
}

module.exports = new RealtimeMetricsService();