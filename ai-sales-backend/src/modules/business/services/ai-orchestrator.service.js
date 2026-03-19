const openAIService = require('./external-apis/openai.service');
const googlePlacesService = require('./external-apis/google-places.service');
const worldBankService = require('./external-apis/world-bank.service');
const kraService = require('./external-apis/kra.service');
const marketResearchService = require('./external-apis/market-research.service');

class AIOrchestrator {
  /**
   * Generate complete business idea with real market data
   */
  async generateCompleteBusinessIdea(userProfile) {
    try {
      // Step 1: Get AI-generated business ideas
      const aiIdeas = await openAIService.generateBusinessIdeas(userProfile);
      
      // Step 2: Enhance with real market data
      const enhancedIdeas = await this.enhanceWithMarketData(aiIdeas.ideas, userProfile.location);
      
      // Step 3: Add economic context
      const economicData = await worldBankService.getKenyaEconomicData();
      
      // Step 4: Add regulatory requirements
      const regulatoryData = await this.getRegulatoryData(enhancedIdeas, userProfile);
      
      // Step 5: Generate marketing content
      const marketingContent = await this.generateMarketingContent(enhancedIdeas[0]);
      
      // Step 6: Create complete response
      return {
        ideas: enhancedIdeas,
        economicContext: economicData,
        regulatoryContext: regulatoryData,
        marketingContent,
        marketTrends: aiIdeas.marketTrends,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('AI Orchestrator Error:', error);
      throw new Error('Failed to generate business idea with real data');
    }
  }

  /**
   * Enhance AI ideas with real market data
   */
  async enhanceWithMarketData(ideas, location) {
    const enhanced = [];
    
    for (const idea of ideas) {
      // Get competitor analysis from Google
      const competitorData = await googlePlacesService.getCompetitorAnalysis(
        idea.sector,
        location
      );

      // Get area demographics
      const areaData = await googlePlacesService.getAreaAnalysis(location);

      // Get industry trends
      const trends = await marketResearchService.getIndustryTrends(idea.sector);

      enhanced.push({
        ...idea,
        realMarketData: {
          competitors: competitorData,
          areaAnalysis: areaData,
          industryTrends: trends,
        },
        confidence: this.calculateConfidence(idea, competitorData, trends),
      });
    }

    return enhanced;
  }

  /**
   * Get regulatory data for ideas
   */
  async getRegulatoryData(ideas, userProfile) {
    const regulatoryData = [];
    
    for (const idea of ideas) {
      const taxInfo = await kraService.getTaxRequirements(
        idea.sector,
        idea.financialProjections.revenueProjections.year1
      );

      const permits = await kraService.getBusinessPermitRequirements(
        userProfile.location.region,
        idea.sector
      );

      regulatoryData.push({
        sector: idea.sector,
        taxInfo,
        permits,
      });
    }

    return regulatoryData;
  }

  /**
   * Generate marketing content for top idea
   */
  async generateMarketingContent(idea) {
    const targetAudience = idea.marketAnalysis.targetCustomers[0];
    return await openAIService.generateMarketingContent(idea, targetAudience);
  }

  /**
   * Calculate confidence score based on real data
   */
  calculateConfidence(idea, competitorData, trends) {
    let score = 70; // Base score

    // Adjust based on competition
    if (competitorData.totalCompetitors < 5) score += 10;
    else if (competitorData.totalCompetitors > 20) score -= 10;

    // Adjust based on industry growth
    if (trends.growth > 7) score += 10;
    else if (trends.growth < 3) score -= 10;

    // Adjust based on market demand
    if (idea.marketAnalysis.demandLevel === 'high') score += 10;
    if (idea.marketAnalysis.demandLevel === 'low') score -= 10;

    return Math.min(100, Math.max(0, score));
  }
}

module.exports = new AIOrchestrator();