const axios = require('axios');

class CentralBankAPIService {
  constructor() {
    // Central Bank of Kenya Open Data API
    this.baseUrl = 'https://www.centralbank.go.ke/api';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Get current exchange rates
   */
  async getExchangeRates() {
    try {
      const response = await this.client.get('/rates/forex');
      
      return {
        base: 'KES',
        rates: response.data.rates.map(rate => ({
          currency: rate.currency_code,
          buying: rate.buying_rate,
          selling: rate.selling_rate,
          date: rate.date
        })),
        lastUpdated: response.data.last_updated
      };
    } catch (error) {
      console.error('CBK API Error:', error.message);
      throw new Error('Failed to fetch exchange rates');
    }
  }

  /**
   * Get inflation rates
   */
  async getInflationRates() {
    try {
      const response = await this.client.get('/statistics/inflation');
      
      return {
        current: response.data.current_rate,
        historical: response.data.historical.map(h => ({
          month: h.month,
          year: h.year,
          rate: h.inflation_rate
        }))
      };
    } catch (error) {
      throw new Error('Failed to fetch inflation rates');
    }
  }

  /**
   * Get interest rates
   */
  async getInterestRates() {
    try {
      const response = await this.client.get('/rates/interest');
      
      return {
        cbr: response.data.central_bank_rate,
        lending: response.data.average_lending_rate,
        deposit: response.data.average_deposit_rate
      };
    } catch (error) {
      throw new Error('Failed to fetch interest rates');
    }
  }
}

module.exports = new CentralBankAPIService();