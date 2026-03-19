const axios = require('axios');
const config = require('../../config/api-config');

class OpenAIService {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        'Authorization': `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Generate business ideas based on user profile
   */
  async generateBusinessIdeas(userProfile) {
    try {
      const prompt = this.buildIdeaGenerationPrompt(userProfile);
      
      const response = await this.client.post('/chat/completions', {
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert business consultant specializing in African markets, particularly Kenya. 
            You have deep knowledge of:
            - Kenyan market dynamics and consumer behavior
            - Local regulations and business environment
            - Startup costs in KES
            - Profit margins in different sectors
            - Regional variations (Nairobi vs rural areas)
            - Digital transformation opportunities
            - M-PESA and mobile money integration
            - Common challenges and success factors
            - Government initiatives and funding opportunities
            - Cultural nuances and local business practices
            
            Provide realistic, actionable business ideas with accurate Kenyan market data.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.openai.temperature,
        max_tokens: config.openai.maxTokens,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      throw new Error('Failed to generate business ideas from AI service');
    }
  }

  /**
   * Build prompt for idea generation
   */
  buildIdeaGenerationPrompt(userProfile) {
    const { skills, interests, location, capital, timeCommitment, experience } = userProfile;
    
    return `Generate 3 viable business ideas for someone in ${location.region}, Kenya with the following profile:

SKILLS: ${skills.join(', ')}
INTERESTS: ${interests.join(', ')}
AVAILABLE CAPITAL: KES ${capital.amount}
TIME COMMITMENT: ${timeCommitment}
EXPERIENCE LEVEL: ${experience}

Return a JSON object with this exact structure:
{
  "ideas": [
    {
      "title": "Business name",
      "tagline": "Short catchy tagline",
      "description": "Detailed business description",
      "sector": "agriculture/retail/technology/services/etc",
      "marketAnalysis": {
        "targetCustomers": ["customer segment 1", "segment 2"],
        "demandLevel": "high/medium/low",
        "competitionLevel": "high/medium/low",
        "marketSize": "estimated market size in KES",
        "growthPotential": "high/medium/low"
      },
      "financialProjections": {
        "startupCosts": {
          "min": 0,
          "max": 0,
          "average": 0,
          "breakdown": [
            {"item": "item name", "cost": 0}
          ]
        },
        "monthlyExpenses": {
          "rent": 0,
          "utilities": 0,
          "salaries": 0,
          "marketing": 0,
          "other": 0
        },
        "revenueProjections": {
          "month1": 0,
          "month3": 0,
          "month6": 0,
          "year1": 0,
          "profitMargin": 0
        },
        "breakevenMonths": 0
      },
      "resources": {
        "equipment": ["item1", "item2"],
        "skills": ["skill1", "skill2"],
        "licenses": ["license1", "license2"],
        "suppliers": ["supplier1", "supplier2"]
      },
      "actionPlan": {
        "steps": [
          {
            "week": 1,
            "action": "action description",
            "cost": 0
          }
        ],
        "timelineToLaunch": "X months"
      },
      "risks": ["risk1", "risk2"],
      "opportunities": ["opportunity1", "opportunity2"],
      "kenyaSpecific": {
        "relevantRegulations": ["regulation1"],
        "governmentSupport": ["program1"],
        "localSuccessFactors": ["factor1"]
      }
    }
  ],
  "marketTrends": {
    "sector": "trending sectors in Kenya",
    "opportunities": ["emerging opportunity"],
    "warnings": ["market saturation warnings"]
  }
}`;
  }

  /**
   * Generate marketing content for business
   */
  async generateMarketingContent(businessIdea, targetAudience) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert marketing copywriter for Kenyan small businesses.'
          },
          {
            role: 'user',
            content: `Create marketing content for a ${businessIdea.title} business targeting ${targetAudience}. Include:
            1. A catchy slogan
            2. Facebook/Instagram ad copy
            3. WhatsApp broadcast message
            4. SMS marketing message
            5. Elevator pitch
            Make it culturally relevant for Kenya.`
          }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI Marketing Error:', error);
      throw error;
    }
  }

  /**
   * Analyze business viability
   */
  async analyzeBusinessViability(businessPlan) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert business analyst specializing in SME viability assessment.'
          },
          {
            role: 'user',
            content: `Analyze this business plan and provide:
            1. Viability score (0-100)
            2. Key strengths
            3. Critical weaknesses
            4. Risk assessment
            5. Success probability
            6. Specific recommendations for the Kenyan market
            
            Business Plan: ${JSON.stringify(businessPlan)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI Analysis Error:', error);
      throw error;
    }
  }
}

module.exports = new OpenAIService();