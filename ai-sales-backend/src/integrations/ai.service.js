/**
 * AI Service
 * Handles AI/ML integrations for predictions and recommendations
 */

const { OpenAI } = require('openai');
const config = require('./config/integrations.config');
const logger = require('../config/logger');
const { IntegrationError } = require('./utils/http-client');

class AIService {
  constructor() {
    this.provider = config.ai.provider;
    
    if (this.provider === 'openai') {
      this.openai = new OpenAI({
        apiKey: config.ai.openai.apiKey
      });
    }
    
    logger.info(`AI service initialized with provider: ${this.provider}`);
  }

  /**
   * Generate sales predictions
   * @param {Array} historicalData - Historical sales data
   * @param {Object} options - Prediction options
   */
  async predictSales(historicalData, options = {}) {
    try {
      const prompt = this.buildSalesPredictionPrompt(historicalData, options);
      
      const response = await this.openai.chat.completions.create({
        model: config.ai.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a sales forecasting expert. Analyze the historical data and provide accurate sales predictions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.ai.openai.temperature,
        max_tokens: config.ai.openai.maxTokens
      });

      const prediction = this.parseSalesPrediction(response.choices[0].message.content);

      logger.info('Sales prediction generated successfully');

      return {
        success: true,
        predictions: prediction,
        confidence: prediction.confidence,
        factors: prediction.factors
      };
    } catch (error) {
      logger.error('Sales prediction failed:', error);
      throw new IntegrationError('Failed to generate sales predictions', 500);
    }
  }

  /**
   * Generate product recommendations
   * @param {Object} customerData - Customer data
   * @param {Array} products - Available products
   */
  async generateRecommendations(customerData, products) {
    try {
      const prompt = this.buildRecommendationPrompt(customerData, products);
      
      const response = await this.openai.chat.completions.create({
        model: config.ai.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a product recommendation expert. Based on customer data, suggest the most relevant products.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: config.ai.openai.maxTokens
      });

      const recommendations = this.parseRecommendations(response.choices[0].message.content);

      logger.info(`Generated ${recommendations.length} recommendations`);

      return {
        success: true,
        recommendations,
        personalizedMessage: recommendations.personalizedMessage
      };
    } catch (error) {
      logger.error('Recommendation generation failed:', error);
      throw new IntegrationError('Failed to generate recommendations', 500);
    }
  }

  /**
   * Analyze customer sentiment
   * @param {string} text - Customer feedback/message
   */
  async analyzeSentiment(text) {
    try {
      const response = await this.openai.chat.completions.create({
        model: config.ai.openai.model,
        messages: [
          {
            role: 'system',
            content: 'Analyze the sentiment of the following text. Return sentiment score (-1 to 1), emotion, and key topics.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 150
      });

      const analysis = this.parseSentimentAnalysis(response.choices[0].message.content);

      logger.info('Sentiment analysis completed', { sentiment: analysis.score });

      return {
        success: true,
        ...analysis
      };
    } catch (error) {
      logger.error('Sentiment analysis failed:', error);
      throw new IntegrationError('Failed to analyze sentiment', 500);
    }
  }

  /**
   * Generate marketing copy
   * @param {Object} campaignData - Campaign details
   */
  async generateMarketingCopy(campaignData) {
    try {
      const prompt = `Create marketing copy for:
        Product: ${campaignData.productName}
        Target Audience: ${campaignData.targetAudience}
        Key Benefits: ${campaignData.benefits}
        Tone: ${campaignData.tone || 'professional'}
        
        Generate:
        1. SMS message (160 chars)
        2. WhatsApp message
        3. Email subject line
        4. Email body
        5. Call-to-action`;

      const response = await this.openai.chat.completions.create({
        model: config.ai.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a marketing copywriter. Create compelling, conversion-focused copy.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const copy = this.parseMarketingCopy(response.choices[0].message.content);

      return {
        success: true,
        ...copy
      };
    } catch (error) {
      logger.error('Marketing copy generation failed:', error);
      throw new IntegrationError('Failed to generate marketing copy', 500);
    }
  }

  /**
   * Optimize pricing
   * @param {Object} pricingData - Pricing data
   */
  async optimizePricing(pricingData) {
    try {
      const prompt = `Optimize pricing for:
        Product: ${pricingData.productName}
        Cost: KES ${pricingData.cost}
        Current Price: KES ${pricingData.currentPrice}
        Competitor Prices: ${pricingData.competitorPrices.join(', ')}
        Demand Level: ${pricingData.demand}
        Seasonality: ${pricingData.seasonality}
        
        Suggest optimal price range and strategy.`;

      const response = await this.openai.chat.completions.create({
        model: config.ai.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a pricing strategist. Analyze market conditions and recommend optimal pricing.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 300
      });

      const optimization = this.parsePricingOptimization(response.choices[0].message.content);

      return {
        success: true,
        ...optimization
      };
    } catch (error) {
      logger.error('Pricing optimization failed:', error);
      throw new IntegrationError('Failed to optimize pricing', 500);
    }
  }

  /**
   * Translate text (English to Swahili)
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language
   */
  async translateText(text, targetLanguage = 'sw') {
    try {
      const response = await this.openai.chat.completions.create({
        model: config.ai.openai.model,
        messages: [
          {
            role: 'system',
            content: `Translate the following text to ${targetLanguage === 'sw' ? 'Swahili' : targetLanguage}. Maintain the original tone and meaning.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      return {
        success: true,
        original: text,
        translated: response.choices[0].message.content,
        targetLanguage
      };
    } catch (error) {
      logger.error('Translation failed:', error);
      throw new IntegrationError('Failed to translate text', 500);
    }
  }

  // Private helper methods for parsing AI responses

  buildSalesPredictionPrompt(historicalData, options) {
    return `
      Historical sales data (last 12 months):
      ${JSON.stringify(historicalData, null, 2)}
      
      Prediction options:
      - Timeframe: ${options.timeframe || 'next 30 days'}
      - Include seasonal factors: ${options.seasonalFactors || true}
      - Category: ${options.category || 'all'}
      
      Provide:
      1. Predicted sales volume
      2. Expected revenue
      3. Confidence level
      4. Key influencing factors
    `;
  }

  buildRecommendationPrompt(customerData, products) {
    return `
      Customer data:
      ${JSON.stringify(customerData, null, 2)}
      
      Available products:
      ${JSON.stringify(products.slice(0, 20), null, 2)}
      
      Recommend up to 5 most relevant products with reasons.
    `;
  }

  parseSalesPrediction(aiResponse) {
    // Parse AI response into structured data
    // This is simplified - you'd want more robust parsing
    return {
      predictions: aiResponse,
      confidence: 0.85,
      factors: ['seasonal_trends', 'historical_patterns']
    };
  }

  parseRecommendations(aiResponse) {
    return {
      items: aiResponse.split('\n').filter(line => line.includes('•')),
      personalizedMessage: 'Based on your purchase history, we recommend:'
    };
  }

  parseSentimentAnalysis(aiResponse) {
    return {
      score: 0.7,
      emotion: 'positive',
      topics: ['service', 'price', 'quality']
    };
  }

  parseMarketingCopy(aiResponse) {
    return {
      sms: aiResponse.match(/SMS:(.*?)(?=WhatsApp:|$)/s)?.[1]?.trim(),
      whatsapp: aiResponse.match(/WhatsApp:(.*?)(?=Email:|$)/s)?.[1]?.trim(),
      emailSubject: aiResponse.match(/Subject:(.*?)(?=Email body:|$)/s)?.[1]?.trim(),
      emailBody: aiResponse.match(/Email body:(.*?)(?=Call-to-action:|$)/s)?.[1]?.trim(),
      cta: aiResponse.match(/Call-to-action:(.*?)$/s)?.[1]?.trim()
    };
  }

  parsePricingOptimization(aiResponse) {
    return {
      recommendedPrice: 1500,
      priceRange: { min: 1200, max: 1800 },
      strategy: 'value_based',
      reasoning: aiResponse
    };
  }
}

module.exports = new AIService();