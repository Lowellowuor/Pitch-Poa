const axios = require('axios');

class KNBSApiService {
  constructor() {
    // Kenya National Bureau of Statistics Open Data API
    // Register at https://opendata.go.ke to get API key
    this.baseUrl = 'https://www.opendata.go.ke/api';
    this.apiKey = process.env.KENYA_OPEN_DATA_TOKEN;
    
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
   * Get business sectors from KNBS official classification
   * Uses Kenya Standard Industrial Classification (KSIC)
   */
  async getBusinessSectors() {
    try {
      // KNBS API endpoint for industrial classification
      const response = await this.client.get('/action/datastore_search', {
        params: {
          resource_id: 'industrial_classification_ksic',
          limit: 100
        }
      });

      if (!response.data?.result?.records) {
        throw new Error('No sector data available');
      }

      return response.data.result.records.map(record => ({
        code: record.ksic_code,
        name: record.sector_name,
        description: record.description,
        category: record.sector_category,
        isic_code: record.isic_code,
        sub_sectors: record.sub_sectors ? record.sub_sectors.split(',') : []
      }));
    } catch (error) {
      console.error('KNBS API Error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch business sectors: ${error.message}`);
    }
  }

  /**
   * Get skills classification from KNBS Labour Force Survey
   */
  async getSkillsClassification() {
    try {
      const response = await this.client.get('/action/datastore_search', {
        params: {
          resource_id: 'labour_force_skills',
          limit: 200
        }
      });

      if (!response.data?.result?.records) {
        throw new Error('No skills data available');
      }

      return response.data.result.records.map(record => ({
        code: record.skill_code,
        name: record.skill_name,
        category: record.skill_category,
        isco_code: record.isco_code, // International Standard Classification of Occupations
        demand_level: record.demand_level,
        average_salary: record.average_monthly_salary,
        training_duration: record.typical_training_duration
      }));
    } catch (error) {
      throw new Error(`Failed to fetch skills: ${error.message}`);
    }
  }

  /**
   * Get economic indicators by county
   */
  async getCountyEconomicData(countyName) {
    try {
      const response = await this.client.get('/action/datastore_search', {
        params: {
          resource_id: 'county_economic_indicators',
          filters: JSON.stringify({ county: countyName })
        }
      });

      if (!response.data?.result?.records?.length) {
        throw new Error(`No data for county: ${countyName}`);
      }

      const data = response.data.result.records[0];
      return {
        county: data.county,
        gdp_contribution: parseFloat(data.gdp_percentage),
        poverty_rate: parseFloat(data.poverty_rate),
        unemployment_rate: parseFloat(data.unemployment_rate),
        literacy_rate: parseFloat(data.literacy_rate),
        main_economic_activities: data.main_activities ? data.main_activities.split(',') : [],
        population: parseInt(data.population),
        household_income: parseFloat(data.average_household_income)
      };
    } catch (error) {
      throw new Error(`Failed to fetch county data: ${error.message}`);
    }
  }

  /**
   * Get sector growth trends
   */
  async getSectorGrowth(sectorCode) {
    try {
      const response = await this.client.get('/action/datastore_search', {
        params: {
          resource_id: 'sector_growth_rates',
          filters: JSON.stringify({ sector_code: sectorCode })
        }
      });

      if (!response.data?.result?.records?.length) {
        return null;
      }

      return response.data.result.records.map(record => ({
        year: record.year,
        growth_rate: parseFloat(record.growth_rate),
        contribution_to_gdp: parseFloat(record.gdp_contribution)
      }));
    } catch (error) {
      throw new Error(`Failed to fetch sector growth: ${error.message}`);
    }
  }
}

module.exports = new KNBSApiService();