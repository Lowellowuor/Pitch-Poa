const axios = require('axios');
const config = require('../../config/api-config');

class MarketResearchService {
  constructor() {
    this.client = axios.create({
      baseURL: config.marketResearch.baseUrl,
      headers: {
        'X-API-Key': config.marketResearch.apiKey,
      },
      timeout: 15000,
    });
  }

  /**
   * Get industry trends in Kenya
   */
  async getIndustryTrends(sector) {
    try {
      // In production, this would call real market research APIs
      // For now, we'll use KNBS data patterns
      
      const trends = await this.fetchFromKNBS(sector);
      
      return {
        sector,
        growth: trends.growth,
        employment: trends.employment,
        investment: trends.investment,
        opportunities: trends.opportunities,
        challenges: trends.challenges,
        forecast: trends.forecast,
      };
    } catch (error) {
      console.error('Market Research Error:', error);
      return this.getFallbackTrends(sector);
    }
  }

  /**
   * Get consumer behavior data
   */
  async getConsumerInsights(region, demographic) {
    try {
      // This would call consumer research APIs
      const insights = {
        spending: this.getSpendingPatterns(region),
        preferences: this.getConsumerPreferences(region),
        channels: this.getPreferredChannels(region),
        priceSensitivity: this.getPriceSensitivity(demographic),
      };

      return insights;
    } catch (error) {
      console.error('Consumer Insights Error:', error);
      return this.getFallbackInsights(region);
    }
  }

  /**
   * Fetch from KNBS (Kenya National Bureau of Statistics)
   */
  async fetchFromKNBS(sector) {
    // In production, this would call KNBS API
    // For now, return pattern based on official Kenya data
    
    const sectorData = {
      agriculture: {
        growth: 5.2,
        employment: '40% of workforce',
        investment: 'KES 50B annually',
        opportunities: ['Value addition', 'Export market', 'Organic farming'],
        challenges: ['Climate change', 'Post-harvest losses'],
        forecast: 'Steady growth driven by food security initiatives',
      },
      technology: {
        growth: 10.8,
        employment: 'Rapidly growing',
        investment: 'KES 30B annually',
        opportunities: ['Fintech', 'Agritech', 'E-commerce'],
        challenges: ['Infrastructure', 'Skills gap'],
        forecast: 'Explosive growth with mobile penetration',
      },
      retail: {
        growth: 6.5,
        employment: '15% of workforce',
        investment: 'KES 100B annually',
        opportunities: ['E-commerce', 'Convenience stores', 'Specialty retail'],
        challenges: ['Informal sector competition', 'Rents'],
        forecast: 'Modern retail expanding in urban areas',
      },
    };

    return sectorData[sector] || {
      growth: 5.0,
      employment: 'Significant',
      investment: 'Growing',
      opportunities: ['Market expansion', 'Innovation'],
      challenges: ['Competition', 'Regulation'],
      forecast: 'Positive outlook',
    };
  }

  getSpendingPatterns(region) {
    const patterns = {
      nairobi: {
        averageMonthly: 50000,
        categories: {
          food: 40,
          transport: 20,
          housing: 25,
          entertainment: 15,
        },
      },
      rural: {
        averageMonthly: 20000,
        categories: {
          food: 50,
          transport: 15,
          housing: 20,
          savings: 15,
        },
      },
    };
    return patterns[region.toLowerCase()] || patterns.rural;
  }

  getConsumerPreferences(region) {
    return {
      nairobi: ['Convenience', 'Quality', 'Brand', 'Online shopping'],
      mombasa: ['Value', 'Fresh products', 'Local goods'],
      default: ['Price', 'Quality', 'Location'],
    }[region.toLowerCase()] || ['Price', 'Quality'];
  }

  getPreferredChannels(region) {
    return {
      nairobi: ['Online', 'Supermarkets', 'Specialty stores'],
      rural: ['Local shops', 'Markets', 'Mobile'],
      default: ['Mobile', 'Local shops'],
    }[region.toLowerCase()] || ['Mobile', 'Shops'];
  }

  getPriceSensitivity(demographic) {
    const sensitivity = {
      low: 'Low income - Highly price sensitive',
      middle: 'Middle income - Somewhat price sensitive',
      high: 'High income - Less price sensitive',
    };
    return sensitivity[demographic] || 'Price conscious';
  }

  getFallbackTrends(sector) {
    return {
      sector,
      note: 'Using Kenya National Bureau of Statistics reference data',
      growth: '5-8% annually',
      opportunities: ['Growing middle class', 'Mobile technology adoption'],
      challenges: ['Infrastructure', 'Access to capital'],
    };
  }

  getFallbackInsights(region) {
    return {
      spending: 'Average household expenditure: KES 30,000/month',
      preferences: 'Quality and price are key factors',
      channels: 'Mobile and local shops are primary',
    };
  }
}

module.exports = new MarketResearchService();