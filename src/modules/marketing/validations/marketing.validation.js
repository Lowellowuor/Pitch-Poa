const Joi = require('joi');

// Channel enum
const CHANNELS = ['facebook', 'instagram', 'twitter', 'linkedin', 'google', 'email', 'sms', 'whatsapp', 'tiktok', 'youtube'];

// Campaign validation
const campaignSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().max(500).optional(),
  channel: Joi.string().valid(...CHANNELS).required(),
  type: Joi.string().valid('awareness', 'consideration', 'conversion', 'retention', 'promotion').required(),
  goal: Joi.string().required(),
  
  targetAudience: Joi.object({
    segments: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
    demographics: Joi.object({
      ageRange: Joi.object({
        min: Joi.number().min(13).max(100),
        max: Joi.number().min(13).max(100)
      }),
      gender: Joi.array().items(Joi.string().valid('male', 'female', 'other')),
      location: Joi.array().items(Joi.string()),
      interests: Joi.array().items(Joi.string())
    }),
    customAudience: Joi.object()
  }).required(),

  budget: Joi.object({
    total: Joi.number().min(0).required(),
    daily: Joi.number().min(0).optional(),
    currency: Joi.string().default('KES')
  }).required(),

  schedule: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    timezone: Joi.string().default('Africa/Nairobi'),
    hours: Joi.array().items(
      Joi.object({
        day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
        start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      })
    )
  }).required(),

  content: Joi.object({
    primary: Joi.object().required(),
    variations: Joi.array().items(Joi.object()),
    media: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('image', 'video', 'document'),
        url: Joi.string().uri()
      })
    )
  }),

  tracking: Joi.object({
    utmSource: Joi.string(),
    utmMedium: Joi.string(),
    utmCampaign: Joi.string(),
    utmContent: Joi.string(),
    trackingPixel: Joi.string(),
    conversionTracking: Joi.boolean()
  }),

  abTest: Joi.object({
    isTest: Joi.boolean(),
    variants: Joi.array().items(
      Joi.object({
        name: Joi.string(),
        content: Joi.object(),
        audience: Joi.number().min(0).max(100)
      })
    ).when('isTest', { is: true, then: Joi.required() })
  })
});

// Content generation validation
const contentGenerationSchema = Joi.object({
  product: Joi.string().required(),
  audience: Joi.string().required(),
  tone: Joi.string().valid('professional', 'casual', 'friendly', 'urgent', 'humorous').required(),
  channel: Joi.string().valid(...CHANNELS).required(),
  goal: Joi.string().valid('awareness', 'engagement', 'conversion', 'retention').required()
});

// Social post validation
const socialPostSchema = Joi.object({
  platforms: Joi.array().items(Joi.string().valid('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok')).min(1).required(),
  content: Joi.object({
    text: Joi.string().max(280).when('platforms', { is: Joi.array().has('twitter'), then: Joi.required() }),
    media: Joi.array().items(Joi.string().uri()),
    link: Joi.string().uri()
  }).required(),
  schedule: Joi.date().iso().optional()
});

// Email campaign validation
const emailCampaignSchema = Joi.object({
  to: Joi.alternatives().try(
    Joi.array().items(Joi.string().email()),
    Joi.string().pattern(/^[0-9a-fA-F]{24}$/) // segment ID
  ).required(),
  from: Joi.string().email().required(),
  subject: Joi.string().required(),
  content: Joi.string().required(),
  template: Joi.string().optional(),
  schedule: Joi.date().iso().optional()
});

// SMS campaign validation
const smsCampaignSchema = Joi.object({
  to: Joi.alternatives().try(
    Joi.array().items(Joi.string().pattern(/^[0-9]{10,12}$/)),
    Joi.string().pattern(/^[0-9a-fA-F]{24}$/) // segment ID
  ).required(),
  message: Joi.string().max(480).required(),
  senderId: Joi.string().max(11).optional(),
  schedule: Joi.date().iso().optional()
});

// WhatsApp campaign validation
const whatsAppCampaignSchema = Joi.object({
  to: Joi.alternatives().try(
    Joi.array().items(Joi.string().pattern(/^[0-9]{10,12}$/)),
    Joi.string().pattern(/^[0-9a-fA-F]{24}$/) // segment ID
  ).required(),
  type: Joi.string().valid('text', 'template', 'media').required(),
  content: Joi.alternatives().when('type', {
    switch: [
      { is: 'text', then: Joi.string().required() },
      { is: 'template', then: Joi.object({
        name: Joi.string().required(),
        language: Joi.string().required(),
        components: Joi.array()
      }).required() },
      { is: 'media', then: Joi.object({
        mediaUrl: Joi.string().uri().required(),
        caption: Joi.string()
      }).required() }
    ]
  }).required()
});

// Audience segment validation
const audienceSegmentSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  criteria: Joi.object({
    demographics: Joi.object({
      ageRange: Joi.object({
        min: Joi.number().min(13),
        max: Joi.number().max(100)
      }),
      gender: Joi.array().items(Joi.string().valid('male', 'female', 'other')),
      location: Joi.array().items(Joi.string()),
      income: Joi.object({
        min: Joi.number(),
        max: Joi.number()
      })
    }),
    behavior: Joi.object({
      purchaseHistory: Joi.object({
        minTransactions: Joi.number(),
        minSpent: Joi.number(),
        lastPurchaseDays: Joi.number()
      }),
      interests: Joi.array().items(Joi.string())
    })
  }).required()
});

// Campaign analytics validation
const campaignAnalyticsSchema = Joi.object({
  period: Joi.string().valid('today', '7d', '30d', '90d', 'custom').default('30d'),
  startDate: Joi.date().iso().when('period', { is: 'custom', then: Joi.required() }),
  endDate: Joi.date().iso().when('period', { is: 'custom', then: Joi.required() }),
  channel: Joi.string().valid(...CHANNELS).optional(),
  campaignId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
});

module.exports = {
  campaignSchema,
  contentGenerationSchema,
  socialPostSchema,
  emailCampaignSchema,
  smsCampaignSchema,
  whatsAppCampaignSchema,
  audienceSegmentSchema,
  campaignAnalyticsSchema
};