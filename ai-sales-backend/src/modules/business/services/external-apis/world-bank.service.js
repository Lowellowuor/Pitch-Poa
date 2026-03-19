const axios = require('axios');
const config = require('../../config/api-config');

class WorldBankService {
  constructor() {
    this.client = axios.create({
      baseURL: config.worldBank.baseUrl,
      params: {
        format: 'json',
      },
      timeout: 10000,
    });
  }

  /**
   * Get economic indicators for Kenya
   */
  async getKenyaEconomicData() {
    try {
      const indicators = [
        'NY.GDP.MKTP.CD', // GDP
        'FP.CPI.TOTL.ZG', // Inflation
        'SL.UEM.TOTL.ZS', // Unemployment
        'IC.BUS.EASE.XQ', // Ease of doing business
        'IC.REG.COST.PC.ZS', // Business registration cost
      ];

      const promises = indicators.map(indicator =>
        this.client.get(`/country/KE/indicator/${indicator}`)
      );

      const responses = await Promise.all(promises);
      
      return this.parseEconomicData(responses);
    } catch (error) {
      console.error('World Bank API Error:', error);
      return this.getFallbackEconomicData();
    }
  }

  /**
   * Get industry-specific data
   */
  async getIndustryData(sector) {
    try {
      const sectorMap = {
        agriculture: 'NV.AGR.TOTL.ZS',
        industry: 'NV.IND.TOTL.ZS',
        services: 'NV.SRV.TOTL.ZS',
      };

      const indicator = sectorMap[sector] || 'NV.AGR.TOTL.ZS';
      
      const response = await this.client.get(`/country/KE/indicator/${indicator}`);
      
      return {
        sector,
        contribution: response.data[1]?.[0]?.value || 0,
        year: response.data[1]?.[0]?.date,
      };
    } catch (error) {
      console.error('Industry Data Error:', error);
      return null;
    }
  }

  /**
   * Parse economic data from API responses
   */
  parseEconomicData(responses) {
    const data = {};
    
    responses.forEach((response, index) => {
      if (response.data && response.data[1] && response.data[1][0]) {
        const value = response.data[1][0].value;
        switch (index) {
          case 0: data.gdp = value; break;
          case 1: data.inflation = value; break;
          case 2: data.unemployment = value; break;
          case 3: data.easeOfBusiness = value; break;
          case 4: data.businessRegistrationCost = value; break;
        }
      }
    });

    return data;
  }

  /**
   * Fallback data when API fails
   */
  getFallbackEconomicData() {
    return {
      gdp: 110347, // USD Millions (World Bank 2023 data)
      inflation: 5.8, // %
      unemployment: 5.7, // %
      easeOfBusiness: 56, // Score
      businessRegistrationCost: 22.5, // % of income per capita
      source: 'Fallback data - API unavailable',
    };
  }
}

module.exports = new WorldBankService();