class BusinessIdeaDTO {
  constructor(idea) {
    this.id = idea._id || idea.id;
    this.title = idea.title;
    this.tagline = idea.tagline;
    this.description = idea.description;
    
    // Only include key market data
    this.market = {
      demand: idea.market?.demand,
      competition: idea.market?.competition?.level,
      targetCustomers: idea.market?.targetCustomers?.map(c => c.segment),
    };

    // Key financials
    this.financial = {
      startupCost: idea.financial?.startupCosts?.estimated,
      profitMargin: idea.financial?.profitMargin,
      breakevenMonth: idea.financial?.breakevenMonth,
    };

    // Feasibility score
    this.feasibility = idea.feasibility?.overall;

    // Generated content
    this.content = {
      businessName: idea.content?.businessName,
      slogan: idea.content?.slogan,
      pitch: idea.content?.pitch,
    };
  }

  static fromDocument(idea) {
    if (!idea) return null;
    return new BusinessIdeaDTO(idea);
  }

  static fromArray(ideas) {
    if (!ideas || !Array.isArray(ideas)) return [];
    return ideas.map(idea => BusinessIdeaDTO.fromDocument(idea));
  }
}

class BusinessIdeaDetailsDTO {
  constructor(idea) {
    this.id = idea._id || idea.id;
    this.title = idea.title;
    this.tagline = idea.tagline;
    this.description = idea.description;
    
    // Full market analysis
    this.market = idea.market;
    
    // Full financial projections
    this.financial = idea.financial;
    
    // Feasibility scores
    this.feasibility = idea.feasibility;
    
    // Resources needed
    this.resources = idea.resources;
    
    // Business model
    this.businessModel = idea.businessModel;
    
    // Action plan
    this.actionPlan = idea.actionPlan;
    
    // Full generated content
    this.content = idea.content;
  }

  static fromDocument(idea) {
    if (!idea) return null;
    return new BusinessIdeaDetailsDTO(idea);
  }
}

class BusinessIdeaResponseDTO {
  constructor(businessIdea) {
    this.id = businessIdea._id || businessIdea.id;
    this.ideas = BusinessIdeaDTO.fromArray(businessIdea.ideas);
    this.analysis = businessIdea.analysis;
    this.status = businessIdea.status;
    this.createdAt = businessIdea.createdAt;
  }

  static fromDocument(businessIdea) {
    if (!businessIdea) return null;
    return new BusinessIdeaResponseDTO(businessIdea);
  }
}

module.exports = {
  BusinessIdeaDTO,
  BusinessIdeaDetailsDTO,
  BusinessIdeaResponseDTO,
};