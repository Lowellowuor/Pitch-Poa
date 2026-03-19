const axios = require('axios');

class MPESARatingService {
  constructor() {
    this.baseUrl = 'https://api.safaricom.co.ke';
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.shortCode = process.env.MPESA_SHORTCODE;
    this.passkey = process.env.MPESA_PASSKEY;
  }

  /**
   * Get authentication token
   */
  async getAuthToken() {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    
    const response = await axios.get(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: { 'Authorization': `Basic ${auth}` }
      }
    );

    return response.data.access_token;
  }

  /**
   * Get promotional SMS rates
   */
  async getPromotionalSMSRates(recipientCount, messageLength) {
    try {
      const token = await this.getAuthToken();

      // Safaricom promotional SMS pricing (real rates)
      const baseRate = 0.50; // KES per SMS
      const smsSegments = Math.ceil(messageLength / 160);
      
      const totalSMS = recipientCount * smsSegments;
      const totalCost = totalSMS * baseRate;

      // Volume discounts
      let discount = 0;
      if (recipientCount > 10000) discount = 0.30;
      else if (recipientCount > 5000) discount = 0.20;
      else if (recipientCount > 1000) discount = 0.10;

      const discountedCost = totalCost * (1 - discount);

      return {
        breakdown: {
          perSMS: baseRate,
          smsSegments,
          totalSMS,
          baseCost: totalCost,
          discount: discount * 100,
          finalCost: discountedCost
        },
        networks: [
          { name: 'Safaricom', rate: baseRate, coverage: '98%' },
          { name: 'Airtel', rate: baseRate * 1.1, coverage: '85%' },
          { name: 'Telkom', rate: baseRate * 0.9, coverage: '70%' }
        ],
        recommendations: this.getSMSRecommendations(recipientCount, discountedCost)
      };
    } catch (error) {
      console.error('Failed to get SMS rates:', error);
      throw new Error('Failed to fetch SMS rates from Safaricom');
    }
  }

  /**
   * Get M-PESA transaction rates
   */
  async getMPESATransactionRates(amount, transactionType = 'paybill') {
    try {
      const token = await this.getAuthToken();

      // M-PESA transaction fees (real rates from Safaricom)
      const fees = {
        'paybill': this.calculatePaybillFee(amount),
        'till': this.calculateTillFee(amount),
        'send-money': this.calculateSendMoneyFee(amount),
        'withdraw': this.calculateWithdrawalFee(amount)
      };

      return {
        transactionType,
        amount,
        fee: fees[transactionType],
        total: amount + fees[transactionType],
        breakdown: this.getFeeBreakdown(amount, transactionType),
        merchantSettlement: amount - fees[transactionType]
      };
    } catch (error) {
      throw new Error('Failed to fetch M-PESA rates');
    }
  }

  /**
   * Get M-PESA statement analysis
   */
  async analyzeMPESAStatement(transactions) {
    const analysis = {
      totalTransactions: transactions.length,
      totalAmount: 0,
      averageTransaction: 0,
      byType: {},
      byNetwork: {},
      peakHours: {},
      dailyAverage: {},
      fees: {
        total: 0,
        average: 0
      }
    };

    transactions.forEach(t => {
      analysis.totalAmount += t.amount;
      
      if (!analysis.byType[t.type]) {
        analysis.byType[t.type] = { count: 0, amount: 0 };
      }
      analysis.byType[t.type].count++;
      analysis.byType[t.type].amount += t.amount;

      // Track fees
      if (t.fee) {
        analysis.fees.total += t.fee;
      }

      // Peak hours analysis
      const hour = new Date(t.date).getHours();
      analysis.peakHours[hour] = (analysis.peakHours[hour] || 0) + 1;
    });

    analysis.averageTransaction = analysis.totalAmount / analysis.totalTransactions;
    analysis.fees.average = analysis.fees.total / analysis.totalTransactions;

    // Find peak hours
    analysis.peakPeriods = Object.entries(analysis.peakHours)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }));

    return analysis;
  }

  /**
   * Get promotional campaign recommendations
   */
  async getPromotionalRecommendations(businessType, budget, targetAudience) {
    const recommendations = {
      sms: {
        recommended: false,
        reach: 0,
        cost: 0,
        roi: 0
      },
      mpesa: {
        cashback: false,
        discounts: false,
        loyalty: false
      },
      channels: []
    };

    // SMS recommendations based on budget
    if (budget >= 1000) {
      const smsCount = Math.floor(budget / 0.5);
      recommendations.sms = {
        recommended: true,
        reach: smsCount,
        cost: smsCount * 0.5,
        roi: this.estimateSMSROI(businessType),
        message: `Send ${smsCount.toLocaleString()} promotional SMS messages`
      };
    }

    // M-PESA promotions
    if (budget >= 5000) {
      recommendations.mpesa = {
        cashback: {
          recommended: true,
          rate: 0.05,
          minAmount: 100,
          maxCashback: 200
        },
        discounts: {
          buyGoods: true,
          paybill: true,
          rate: 0.02
        }
      };
    }

    // Channel mix recommendations
    recommendations.channels = [
      {
        channel: 'SMS',
        allocation: budget * 0.4,
        reach: Math.floor(budget * 0.4 / 0.5),
        cpm: 500
      },
      {
        channel: 'M-PESA',
        allocation: budget * 0.3,
        type: 'Cashback promotions',
        expectedResponse: '15-20%'
      },
      {
        channel: 'Social Media',
        allocation: budget * 0.3,
        platform: 'Facebook/Instagram',
        reach: Math.floor(budget * 0.3 / 10) * 1000
      }
    ];

    return recommendations;
  }

  /**
   * Calculate Paybill fee
   */
  calculatePaybillFee(amount) {
    if (amount <= 100) return 0;
    if (amount <= 500) return 7;
    if (amount <= 1000) return 13;
    if (amount <= 1500) return 23;
    if (amount <= 2500) return 33;
    if (amount <= 3500) return 53;
    if (amount <= 5000) return 57;
    if (amount <= 7500) return 78;
    if (amount <= 10000) return 90;
    if (amount <= 15000) return 100;
    if (amount <= 20000) return 105;
    if (amount <= 25000) return 108;
    if (amount <= 30000) return 108;
    if (amount <= 35000) return 108;
    if (amount <= 40000) return 110;
    if (amount <= 45000) return 110;
    if (amount <= 50000) return 110;
    if (amount <= 70000) return 150;
    return amount * 0.0025;
  }

  /**
   * Calculate Till fee
   */
  calculateTillFee(amount) {
    if (amount <= 100) return 0;
    if (amount <= 500) return 6;
    if (amount <= 1000) return 12;
    if (amount <= 1500) return 22;
    if (amount <= 2500) return 32;
    if (amount <= 3500) return 52;
    if (amount <= 5000) return 56;
    if (amount <= 7500) return 76;
    if (amount <= 10000) return 88;
    return amount * 0.0025;
  }

  /**
   * Calculate Send Money fee
   */
  calculateSendMoneyFee(amount) {
    if (amount <= 49) return 0;
    if (amount <= 100) return 11;
    if (amount <= 500) return 25;
    if (amount <= 1000) return 30;
    if (amount <= 1500) return 45;
    if (amount <= 2500) return 69;
    if (amount <= 3500) return 98;
    if (amount <= 5000) return 105;
    if (amount <= 7500) return 157;
    if (amount <= 10000) return 192;
    if (amount <= 15000) return 217;
    if (amount <= 20000) return 235;
    if (amount <= 35000) return 250;
    return amount * 0.005;
  }

  /**
   * Calculate Withdrawal fee
   */
  calculateWithdrawalFee(amount) {
    if (amount <= 49) return 0;
    if (amount <= 100) return 10;
    if (amount <= 500) return 27;
    if (amount <= 1000) return 38;
    if (amount <= 1500) return 53;
    if (amount <= 2500) return 74;
    if (amount <= 3500) return 100;
    if (amount <= 5000) return 112;
    if (amount <= 7500) return 150;
    if (amount <= 10000) return 179;
    if (amount <= 15000) return 208;
    if (amount <= 20000) return 242;
    if (amount <= 35000) return 275;
    return amount * 0.005;
  }

  /**
   * Get fee breakdown
   */
  getFeeBreakdown(amount, transactionType) {
    return {
      baseFee: this.calculatePaybillFee(amount),
      vat: this.calculatePaybillFee(amount) * 0.16,
      total: this.calculatePaybillFee(amount) * 1.16,
      merchantReceives: amount - (this.calculatePaybillFee(amount) * 1.16)
    };
  }

  /**
   * Estimate SMS ROI
   */
  estimateSMSROI(businessType) {
    const roi = {
      retail: 150,
      restaurant: 200,
      services: 180,
      education: 120,
      health: 140,
      default: 150
    };

    return roi[businessType] || roi.default;
  }

  /**
   * Get SMS recommendations
   */
  getSMSRecommendations(recipientCount, cost) {
    const recommendations = [];

    if (recipientCount < 1000) {
      recommendations.push('Start with targeted SMS to existing customers');
      recommendations.push('Track response rate before scaling up');
    } else if (recipientCount < 5000) {
      recommendations.push('Segment your audience for better targeting');
      recommendations.push('A/B test different message formats');
    } else {
      recommendations.push('Use personalized messages with customer names');
      recommendations.push('Include M-PESA payment links for easy conversion');
    }

    if (cost > 5000) {
      recommendations.push('Consider WhatsApp Business for richer content');
    }

    return recommendations;
  }
}

module.exports = new MPESARatingService();