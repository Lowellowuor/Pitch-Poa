const kenyaAdminAPI = require('./external-apis/kenya-admin-api.service');
const knbsAPI = require('./external-apis/knbs-api.service');
const nitaAPI = require('./external-apis/nita-api.service');
const kaziappAPI = require('./external-apis/kaziapp-api.service');

class ValidationDataService {
  /**
   * Get all Kenyan regions from real API
   */
  async getKenyanRegions() {
    try {
      const counties = await kenyaAdminAPI.getAllCounties();
      return counties.map(c => c.name);
    } catch (error) {
      console.error('Failed to fetch regions:', error);
      throw new Error('Unable to fetch Kenyan regions from government API');
    }
  }

  /**
   * Get all business sectors from KNBS
   */
  async getBusinessSectors() {
    try {
      const sectors = await knbsAPI.getBusinessSectors();
      return sectors.map(s => ({
        code: s.code,
        name: s.name,
        category: s.category
      }));
    } catch (error) {
      throw new Error('Unable to fetch business sectors from KNBS');
    }
  }

  /**
   * Get all skills categories from multiple sources
   */
  async getSkillCategories() {
    try {
      // Get from NITA (accredited trades)
      const nitaTrades = await nitaAPI.getAccreditedTrades();
      
      // Get from job market (in-demand skills)
      const marketSkills = await kaziappAPI.getInDemandSkills();
      
      // Combine and deduplicate
      const allSkills = [...nitaTrades, ...marketSkills];
      const uniqueSkills = [...new Map(
        allSkills.map(skill => [skill.name.toLowerCase(), skill])
      ).values()];

      return uniqueSkills.map(s => ({
        name: s.name,
        category: s.category || s.certification_level,
        source: s.institutions_count ? 'nita' : 'market'
      }));
    } catch (error) {
      throw new Error('Unable to fetch skills from training authorities');
    }
  }

  /**
   * Validate location exists in real government data
   */
  async validateLocation(region, constituency = null, ward = null) {
    return await kenyaAdminAPI.validateLocation(region, constituency, ward);
  }

  /**
   * Validate skill exists and is accredited
   */
  async validateSkill(skillName) {
    try {
      // Check NITA accreditation first
      const nitaValidation = await nitaAPI.validateTrade(skillName);
      
      if (nitaValidation.valid) {
        return nitaValidation;
      }

      // Check market demand
      const marketDemand = await kaziappAPI.getSkillDemand(skillName);
      
      if (marketDemand && marketDemand.demand_score > 0) {
        return {
          valid: true,
          source: 'market',
          demand: marketDemand
        };
      }

      return {
        valid: false,
        message: `Skill '${skillName}' not found in any accredited database`
      };
    } catch (error) {
      throw new Error(`Skill validation failed: ${error.message}`);
    }
  }

  /**
   * Validate sector exists in KNBS classification
   */
  async validateSector(sectorName) {
    try {
      const sectors = await this.getBusinessSectors();
      const sector = sectors.find(s => 
        s.name.toLowerCase() === sectorName.toLowerCase() ||
        s.code.toLowerCase() === sectorName.toLowerCase()
      );

      if (!sector) {
        return {
          valid: false,
          message: `Sector '${sectorName}' not found in KNBS classification`
        };
      }

      return {
        valid: true,
        sector: sector
      };
    } catch (error) {
      throw new Error(`Sector validation failed: ${error.message}`);
    }
  }

  /**
   * Get all validation data at once (cached for performance)
   */
  async getAllValidationData() {
    const [regions, sectors, skills] = await Promise.all([
      this.getKenyanRegions(),
      this.getBusinessSectors(),
      this.getSkillCategories()
    ]);

    return {
      regions,
      sectors: sectors.map(s => s.name),
      sectors_full: sectors,
      skills: skills.map(s => s.name),
      skills_full: skills,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new ValidationDataService();