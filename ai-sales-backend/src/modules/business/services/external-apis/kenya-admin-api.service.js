const axios = require('axios');

class KenyaAdminAPIService {
  constructor() {
    // Using the public Kenya Admin API from GitHub (deployed instance)
    // Multiple options available:
    // - https://kenya-administrative-boundaries-api-ken-admin-api.vercel.app
    // - https://kenya-counties-api.herokuapp.com
    this.baseUrl = process.env.KENYA_ADMIN_API_URL || 'https://kenya-administrative-boundaries-api-ken-admin-api.vercel.app/api';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AI-Sales-Backend/1.0'
      }
    });
  }

  /**
   * Get all counties from real API
   * Data source: IEBC (Independent Electoral and Boundaries Commission)
   */
  async getAllCounties() {
    try {
      const response = await this.client.get('/counties');
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from Kenya Admin API');
      }

      return response.data.map(county => ({
        id: county.id,
        name: county.name,
        capital: county.capital,
        code: county.code,
        population: county.population,
        area: county.area,
        region: county.region,
        constituencies_count: county.constituencies_count || 0,
        coordinates: county.coordinates
      }));
    } catch (error) {
      console.error('Kenya Admin API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(`Failed to fetch counties from Kenya Admin API: ${error.message}`);
    }
  }

  /**
   * Get specific county by ID
   */
  async getCountyById(countyId) {
    try {
      const response = await this.client.get(`/counties/${countyId}`);
      
      if (!response.data) {
        throw new Error('County not found');
      }

      return {
        id: response.data.id,
        name: response.data.name,
        capital: response.data.capital,
        code: response.data.code,
        population: response.data.population,
        area: response.data.area,
        region: response.data.region
      };
    } catch (error) {
      throw new Error(`Failed to fetch county ${countyId}: ${error.message}`);
    }
  }

  /**
   * Get constituencies for a county
   */
  async getConstituenciesByCounty(countyName) {
    try {
      // First get county ID
      const counties = await this.getAllCounties();
      const county = counties.find(c => 
        c.name.toLowerCase() === countyName.toLowerCase()
      );

      if (!county) {
        throw new Error(`County ${countyName} not found`);
      }

      const response = await this.client.get(`/constituencies`, {
        params: { county_id: county.id }
      });

      return response.data.map(constituency => ({
        id: constituency.id,
        name: constituency.name,
        code: constituency.code,
        county_id: constituency.county_id,
        wards_count: constituency.wards_count || 0
      }));
    } catch (error) {
      throw new Error(`Failed to fetch constituencies: ${error.message}`);
    }
  }

  /**
   * Get wards for a constituency
   */
  async getWardsByConstituency(constituencyName, countyName) {
    try {
      // Get all counties first
      const counties = await this.getAllCounties();
      const county = counties.find(c => 
        c.name.toLowerCase() === countyName.toLowerCase()
      );

      if (!county) {
        throw new Error(`County ${countyName} not found`);
      }

      // Get constituencies for this county
      const constituencies = await this.getConstituenciesByCounty(countyName);
      const constituency = constituencies.find(c => 
        c.name.toLowerCase() === constituencyName.toLowerCase()
      );

      if (!constituency) {
        throw new Error(`Constituency ${constituencyName} not found in ${countyName}`);
      }

      const response = await this.client.get(`/wards`, {
        params: { constituency_id: constituency.id }
      });

      return response.data.map(ward => ({
        id: ward.id,
        name: ward.name,
        code: ward.code,
        constituency_id: ward.constituency_id
      }));
    } catch (error) {
      throw new Error(`Failed to fetch wards: ${error.message}`);
    }
  }

  /**
   * Search locations by name
   */
  async searchLocations(query) {
    try {
      const response = await this.client.get(`/search/${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Validate if a location exists
   */
  async validateLocation(region, constituency = null, ward = null) {
    try {
      const counties = await this.getAllCounties();
      const countyExists = counties.some(c => 
        c.name.toLowerCase() === region.toLowerCase()
      );

      if (!countyExists) {
        return { valid: false, message: `County ${region} not found` };
      }

      if (constituency) {
        const constituencies = await this.getConstituenciesByCounty(region);
        const constituencyExists = constituencies.some(c => 
          c.name.toLowerCase() === constituency.toLowerCase()
        );

        if (!constituencyExists) {
          return { valid: false, message: `Constituency ${constituency} not found in ${region}` };
        }

        if (ward) {
          const wards = await this.getWardsByConstituency(constituency, region);
          const wardExists = wards.some(w => 
            w.name.toLowerCase() === ward.toLowerCase()
          );

          if (!wardExists) {
            return { valid: false, message: `Ward ${ward} not found in ${constituency}` };
          }
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }
}

module.exports = new KenyaAdminAPIService();