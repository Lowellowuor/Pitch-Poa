const axios = require('axios');

class KaziAppApiService {
  constructor() {
    // Kazi App API - Real jobs and skills platform
    // Public API endpoint
    this.baseUrl = 'https://api.kazi.app/v1';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Get in-demand skills from real job market
   */
  async getInDemandSkills(county = null) {
    try {
      const params = {};
      if (county) params.location = county;

      const response = await this.client.get('/skills/in-demand', { params });
      
      if (!response.data?.skills) {
        throw new Error('No skills data available');
      }

      return response.data.skills.map(skill => ({
        name: skill.skill_name,
        category: skill.category,
        demand_level: skill.demand_score,
        job_count: skill.open_positions,
        average_salary: skill.average_salary,
        growth_rate: skill.demand_growth,
        employers: skill.top_employers
      }));
    } catch (error) {
      console.error('Kazi App API Error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch skills: ${error.message}`);
    }
  }

  /**
   * Get job categories from real market
   */
  async getJobCategories() {
    try {
      const response = await this.client.get('/categories');
      
      if (!response.data?.categories) {
        throw new Error('No category data');
      }

      return response.data.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        subcategories: cat.subcategories,
        total_jobs: cat.job_count
      }));
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  /**
   * Get market demand for specific skill
   */
  async getSkillDemand(skillName, county = null) {
    try {
      const params = { skill: skillName };
      if (county) params.location = county;

      const response = await this.client.get('/skills/demand', { params });
      
      if (!response.data) {
        return null;
      }

      return {
        skill: response.data.skill,
        demand_score: response.data.demand_score,
        job_openings: response.data.job_openings,
        employers_seeking: response.data.employers_count,
        salary_range: response.data.salary_range,
        trends: response.data.demand_trend
      };
    } catch (error) {
      throw new Error(`Failed to fetch skill demand: ${error.message}`);
    }
  }
}

module.exports = new KaziAppApiService();