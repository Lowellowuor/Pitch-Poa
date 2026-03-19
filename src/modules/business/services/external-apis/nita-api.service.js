const axios = require('axios');

class NITAApiService {
  constructor() {
    // National Industrial Training Authority API
    // Register at https://nita.go.ke/developers
    this.baseUrl = process.env.NITA_API_URL || 'https://api.nita.go.ke/v1';
    this.apiKey = process.env.NITA_API_KEY;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get accredited trades from NITA
   * Real data from National Industrial Training Authority
   */
  async getAccreditedTrades() {
    try {
      const response = await this.client.get('/trades/accredited');
      
      if (!response.data?.trades) {
        throw new Error('No trade data available');
      }

      return response.data.trades.map(trade => ({
        code: trade.trade_code,
        name: trade.trade_name,
        category: trade.trade_category,
        duration_months: trade.training_duration,
        certification_level: trade.certification_level,
        curriculum: trade.curriculum_code,
        institutions_count: trade.training_institutions_count,
        demand_level: trade.market_demand
      }));
    } catch (error) {
      console.error('NITA API Error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch accredited trades: ${error.message}`);
    }
  }

  /**
   * Get training institutions by location
   */
  async getTrainingInstitutions(county, tradeCode = null) {
    try {
      const params = { county };
      if (tradeCode) params.trade = tradeCode;

      const response = await this.client.get('/institutions', { params });
      
      if (!response.data?.institutions) {
        return [];
      }

      return response.data.institutions.map(inst => ({
        name: inst.institution_name,
        type: inst.institution_type,
        location: {
          county: inst.county,
          constituency: inst.constituency,
          address: inst.postal_address
        },
        contacts: {
          phone: inst.phone_number,
          email: inst.email,
          website: inst.website
        },
        accredited_trades: inst.accredited_trades || [],
        capacity: inst.training_capacity
      }));
    } catch (error) {
      throw new Error(`Failed to fetch institutions: ${error.message}`);
    }
  }

  /**
   * Validate if a skill/trade is accredited
   */
  async validateTrade(tradeName) {
    try {
      const trades = await this.getAccreditedTrades();
      const trade = trades.find(t => 
        t.name.toLowerCase() === tradeName.toLowerCase() ||
        t.code.toLowerCase() === tradeName.toLowerCase()
      );

      if (!trade) {
        return { 
          valid: false, 
          message: `Trade '${tradeName}' is not NITA accredited` 
        };
      }

      return {
        valid: true,
        trade: trade
      };
    } catch (error) {
      throw new Error(`Trade validation failed: ${error.message}`);
    }
  }
}

module.exports = new NITAApiService();