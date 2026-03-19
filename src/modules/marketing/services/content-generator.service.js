const openAIService = require('../../ai/services/external-apis/openai.service');
const Content = require('../models/content.model');
const ApiError = require('../../../shared/utils/apiError');

class ContentGeneratorService {
  /**
   * Generate marketing content
   */
  async generateContent(params) {
    const { product, audience, tone, channel, goal } = params;

    const prompt = this.buildContentPrompt(params);

    try {
      const response = await openAIService.generateContent(prompt);

      return {
        headline: response.headline,
        body: response.body,
        cta: response.cta,
        variations: response.variations,
        suggestions: response.suggestions
      };
    } catch (error) {
      throw new ApiError(500, `Content generation failed: ${error.message}`);
    }
  }

  /**
   * Generate social media posts
   */
  async generateSocialPosts(product, audience, platforms) {
    const posts = {};

    for (const platform of platforms) {
      const prompt = this.buildSocialPrompt(platform, product, audience);
      
      try {
        const response = await openAIService.generateContent(prompt);
        
        posts[platform] = {
          text: response.text,
          hashtags: response.hashtags,
          bestTime: this.getBestPostingTime(platform),
          imageSuggestions: response.imageIdeas
        };
      } catch (error) {
        posts[platform] = { error: `Failed to generate for ${platform}` };
      }
    }

    return posts;
  }

  /**
   * Generate email content
   */
  async generateEmail(type, product, audience, offer) {
    const prompt = this.buildEmailPrompt(type, product, audience, offer);

    try {
      const response = await openAIService.generateContent(prompt);

      return {
        subject: response.subject,
        preview: response.preview,
        body: response.body,
        cta: response.cta,
        html: response.html,
        plainText: response.plainText
      };
    } catch (error) {
      throw new ApiError(500, `Email generation failed: ${error.message}`);
    }
  }

  /**
   * Generate SMS content
   */
  async generateSMS(message, audience, characterLimit = 160) {
    const prompt = `
      Create an SMS marketing message based on:
      Core message: ${message}
      Target audience: ${audience}
      Character limit: ${characterLimit}
      
      Return JSON with:
      - message: the SMS text
      - characterCount: number of characters
      - segments: number of SMS segments
      - alternative: shorter alternative if needed
    `;

    try {
      const response = await openAIService.generateContent(prompt);

      return {
        original: response.message,
        characterCount: response.characterCount,
        segments: response.segments,
        alternative: response.alternative
      };
    } catch (error) {
      throw new ApiError(500, `SMS generation failed: ${error.message}`);
    }
  }

  /**
   * Generate WhatsApp message
   */
  async generateWhatsApp(message, audience, includeMedia = false) {
    const prompt = `
      Create a WhatsApp business message based on:
      Content: ${message}
      Audience: ${audience}
      Include media suggestions: ${includeMedia}
      
      Return JSON with:
      - message: the WhatsApp message
      - mediaSuggestions: array of media ideas (if includeMedia)
      - quickReplies: suggested quick reply buttons
      - callToAction: suggested CTA
    `;

    try {
      const response = await openAIService.generateContent(prompt);

      return {
        message: response.message,
        mediaSuggestions: response.mediaSuggestions || [],
        quickReplies: response.quickReplies || [],
        callToAction: response.callToAction
      };
    } catch (error) {
      throw new ApiError(500, `WhatsApp generation failed: ${error.message}`);
    }
  }

  /**
   * Generate ad copy
   */
  async generateAdCopy(platform, product, audience, objective) {
    const prompt = this.buildAdPrompt(platform, product, audience, objective);

    try {
      const response = await openAIService.generateContent(prompt);

      return {
        headline: response.headline,
        primaryText: response.primaryText,
        description: response.description,
        cta: response.cta,
        displayUrl: response.displayUrl,
        variations: response.variations
      };
    } catch (error) {
      throw new ApiError(500, `Ad copy generation failed: ${error.message}`);
    }
  }

  /**
   * Generate video script
   */
  async generateVideoScript(product, audience, duration, style) {
    const prompt = `
      Create a ${duration}-second video script for:
      Product: ${product}
      Audience: ${audience}
      Style: ${style}
      
      Return JSON with:
      - hook: opening hook (0-5 seconds)
      - problem: problem statement (5-15 seconds)
      - solution: product introduction (15-30 seconds)
      - benefits: key benefits (30-45 seconds)
      - cta: call to action (45-60 seconds)
      - visualDirections: visual suggestions for each segment
      - audioDirections: music/sound suggestions
    `;

    try {
      const response = await openAIService.generateContent(prompt);

      return {
        script: response,
        totalDuration: duration,
        segments: [
          { time: '0-5s', content: response.hook, visuals: response.visualDirections?.hook },
          { time: '5-15s', content: response.problem, visuals: response.visualDirections?.problem },
          { time: '15-30s', content: response.solution, visuals: response.visualDirections?.solution },
          { time: '30-45s', content: response.benefits, visuals: response.visualDirections?.benefits },
          { time: '45-60s', content: response.cta, visuals: response.visualDirections?.cta }
        ],
        audioDirections: response.audioDirections
      };
    } catch (error) {
      throw new ApiError(500, `Video script generation failed: ${error.message}`);
    }
  }

  /**
   * Generate hashtags
   */
  async generateHashtags(topic, count = 10) {
    const prompt = `
      Generate ${count} hashtags for: ${topic}
      Include a mix of:
      - Popular hashtags (high volume)
      - Niche hashtags (targeted)
      - Branded hashtags (if applicable)
      - Trending hashtags (if applicable)
      
      Return JSON with:
      - hashtags: array of hashtag strings
      - categories: object with hashtags by category
      - recommendations: suggested primary hashtag
    `;

    try {
      const response = await openAIService.generateContent(prompt);

      return {
        all: response.hashtags,
        byCategory: response.categories,
        recommended: response.recommendations,
        count: response.hashtags.length
      };
    } catch (error) {
      throw new ApiError(500, `Hashtag generation failed: ${error.message}`);
    }
  }

  /**
   * Translate content
   */
  async translateContent(content, targetLanguage, sourceLanguage = 'en') {
    const prompt = `
      Translate the following content from ${sourceLanguage} to ${targetLanguage}:
      
      "${content}"
      
      Return JSON with:
      - translated: the translated text
      - confidence: translation confidence score
      - alternatives: array of alternative translations
      - notes: any cultural adaptation notes
    `;

    try {
      const response = await openAIService.generateContent(prompt);

      return {
        original: content,
        translated: response.translated,
        language: targetLanguage,
        confidence: response.confidence,
        alternatives: response.alternatives,
        notes: response.notes
      };
    } catch (error) {
      throw new ApiError(500, `Translation failed: ${error.message}`);
    }
  }

  /**
   * Save generated content
   */
  async saveContent(businessId, contentData) {
    const content = new Content({
      businessId,
      ...contentData,
      createdAt: new Date()
    });

    await content.save();
    return content;
  }

  /**
   * Get saved content
   */
  async getSavedContent(businessId, filters) {
    const query = { businessId };

    if (filters.type) {
      query.type = filters.type;
    }

    const total = await Content.countDocuments(query);

    const content = await Content.find(query)
      .sort({ createdAt: -1 })
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit)
      .lean();

    return {
      content,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit)
      }
    };
  }

  /**
   * Build content prompt
   */
  buildContentPrompt(params) {
    const { product, audience, tone, channel, goal } = params;

    return `
      Create marketing content with the following parameters:
      
      Product/Service: ${product}
      Target Audience: ${audience}
      Tone: ${tone}
      Channel: ${channel}
      Marketing Goal: ${goal}
      
      Return JSON with:
      - headline: attention-grabbing headline
      - body: main marketing message
      - cta: call to action
      - variations: 3 alternative variations
      - suggestions: improvement suggestions
    `;
  }

  /**
   * Build social media prompt
   */
  buildSocialPrompt(platform, product, audience) {
    return `
      Create a ${platform} post for:
      Product: ${product}
      Audience: ${audience}
      
      Consider ${platform} best practices:
      - Facebook: longer text, link-friendly
      - Instagram: visual-focused, hashtag-heavy
      - Twitter: concise, timely
      - LinkedIn: professional, value-focused
      - TikTok: trending, engaging
      
      Return JSON with:
      - text: the post text
      - hashtags: relevant hashtags array
      - imageIdeas: suggestions for images/video
    `;
  }

  /**
   * Build email prompt
   */
  buildEmailPrompt(type, product, audience, offer) {
    return `
      Create a ${type} email for:
      Product: ${product}
      Audience: ${audience}
      Special Offer: ${offer || 'None'}
      
      Return JSON with:
      - subject: email subject line
      - preview: preview text
      - body: email body with proper formatting
      - cta: call to action button text
      - html: HTML version
      - plainText: plain text version
    `;
  }

  /**
   * Build ad prompt
   */
  buildAdPrompt(platform, product, audience, objective) {
    return `
      Create ${platform} ad copy for:
      Product: ${product}
      Audience: ${audience}
      Objective: ${objective}
      
      Follow ${platform} ad guidelines:
      - Headline: max 40 characters
      - Primary text: max 125 characters
      - Description: max 30 characters
      - CTA: platform-specific CTAs
      
      Return JSON with:
      - headline: primary headline
      - primaryText: main ad text
      - description: additional details
      - cta: call to action
      - displayUrl: display URL
      - variations: 3 alternative combinations
    `;
  }

  /**
   * Get best posting time by platform
   */
  getBestPostingTime(platform) {
    const times = {
      facebook: { weekday: '9am-1pm', weekend: '12pm-4pm' },
      instagram: { weekday: '11am-1pm', weekend: '10am-11am' },
      twitter: { weekday: '8am-10am', weekend: '9am-11am' },
      linkedin: { weekday: '8am-10am, 12pm-1pm', weekend: 'none' },
      tiktok: { weekday: '6am-10am, 7pm-11pm', weekend: '12pm-6pm' }
    };

    return times[platform] || { weekday: '9am-5pm', weekend: '10am-2pm' };
  }
}

module.exports = new ContentGeneratorService();