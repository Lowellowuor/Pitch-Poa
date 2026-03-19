const Joi = require('joi');

// Kenyan locations
const KENYAN_REGIONS = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 
  'Kiambu', 'Machakos', 'Meru', 'Nyeri', 'Kakamega', 'Garissa'
];

// Business sectors relevant to Kenya
const BUSINESS_SECTORS = [
  'agriculture', 'livestock', 'retail', 'wholesale', 'manufacturing',
  'services', 'technology', 'transport', 'construction', 'real-estate',
  'hospitality', 'education', 'healthcare', 'fashion', 'beauty',
  'food-processing', 'agribusiness', 'digital-services', 'creative',
  'import-export', 'logistics', 'renewable-energy', 'waste-management'
];

// Skills assessment
const SKILL_CATEGORIES = [
  'cooking', 'sewing', 'tailoring', 'carpentry', 'plumbing', 'electrical',
  'driving', 'computer', 'smartphone', 'social-media', 'marketing',
  'accounting', 'management', 'sales', 'customer-service', 'language',
  'writing', 'design', 'photography', 'videography', 'catering'
];

// Validation schema for user input
const businessIdeaInputSchema = Joi.object({
  skills: Joi.array()
    .items(Joi.string().valid(...SKILL_CATEGORIES))
    .min(1)
    .required()
    .messages({
      'array.min': 'Please select at least one skill you have',
      'any.required': 'Skills are required',
    }),

  interests: Joi.array()
    .items(Joi.string())
    .min(1)
    .required()
    .messages({
      'array.min': 'Please select at least one interest',
      'any.required': 'Interests are required',
    }),

  location: Joi.object({
    country: Joi.string().default('Kenya'),
    region: Joi.string().valid(...KENYAN_REGIONS).required()
      .messages({ 'any.required': 'Please select your region' }),
    constituency: Joi.string().optional(),
    ward: Joi.string().optional(),
  }).required(),

  capital: Joi.object({
    amount: Joi.number().min(0).required()
      .messages({ 'number.min': 'Capital cannot be negative' }),
    currency: Joi.string().default('KES'),
  }).required(),

  timeCommitment: Joi.string()
    .valid('full-time', 'part-time', 'weekend-only')
    .required(),

  experience: Joi.string()
    .valid('none', 'beginner', 'intermediate', 'expert')
    .required(),

  preferredSector: Joi.array()
    .items(Joi.string().valid(...BUSINESS_SECTORS))
    .min(1)
    .optional(),

  additionalInfo: Joi.string()
    .max(500)
    .optional(),
});

// Validation for idea selection
const selectIdeaSchema = Joi.object({
  ideaId: Joi.string().required(),
  businessIdeaId: Joi.string().required(),
});

// Validation for idea generation request
const generateIdeaRequestSchema = Joi.object({
  count: Joi.number().integer().min(1).max(10).default(3),
  includePlan: Joi.boolean().default(true),
});

module.exports = {
  businessIdeaInputSchema,
  selectIdeaSchema,
  generateIdeaRequestSchema,
  KENYAN_REGIONS,
  BUSINESS_SECTORS,
  SKILL_CATEGORIES,
};