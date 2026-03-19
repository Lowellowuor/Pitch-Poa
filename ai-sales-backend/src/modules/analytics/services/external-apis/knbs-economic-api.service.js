const axios = require('axios');

class KNBSEconomicAPIService {
  constructor() {
    // Kenya National Bureau of Statistics Economic Data
    this.baseUrl = 'https://api.knbs.or.ke/economic';
    this.apiKey = process.env.KNBS_API_KEY;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'X-API-Key': this.apiKey,
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Get GDP data
   */
  async getGDPData() {
    try {
      const response = await this.client.get('/gdp');
      
      return {
        current: response.data.current_gdp,
        growth: response.data.growth_rate,
        bySector: response.data.sector_breakdown.map(s => ({
          sector: s.sector_name,
          contribution: s.percentage
        }))
      };
    } catch (error) {
      throw new Error('Failed to fetch GDP data');
    }
  }

  /**
   * Get sector performance
   */
  async getSectorPerformance(sectorCode) {
    try {
      const response = await this.client.get(`/sectors/${sectorCode}/performance`);
      
      return {
        sector: response.data.sector_name,
        growth: response.data.annual_growth,
        employment: response.data.employment_numbers,
        output: response.data.production_output
      };
    } catch (error) {
      throw new Error('Failed to fetch sector performance');
    }
  }

  /**
   * Get consumer price index
   */
  async getCPI() {
    try {
      const response = await this.client.get('/cpi');
      
      return {
        current: response.data.current_index,
        change: response.data.monthly_change,
        categories: response.data.category_indices
      };
    } catch (error) {
      throw new Error('Failed to fetch CPI data');
    }
  }
}

module.exports = new KNBSEconomicAPIService();