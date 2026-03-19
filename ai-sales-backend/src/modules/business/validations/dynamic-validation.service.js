const Joi = require('joi');
const validationDataService = require('../services/validation-data.service');

class DynamicValidationService {
  constructor() {
    this.cachedData = null;
    this.cacheTimestamp = null;
    this.CACHE_DURATION = 3600000; // 1 hour in milliseconds
  }

  /**
   * Get fresh validation data from APIs
   */
  async getFreshValidationData() {
    // Check cache
    if (this.cachedData && this.cacheTimestamp && 
        (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.cachedData;
    }

    // Fetch fresh data
    this.cachedData = await validationDataService.getAllValidationData();
    this.cacheTimestamp = Date.now();
    
    return this.cachedData;
  }

  /**
   * Create dynamic Joi schema with real-time data
   */
  async createBusinessIdeaSchema() {
    const data = await this.getFreshValidationData();

    return Joi.object({
      skills: Joi.array()
        .items(Joi.string().valid(...data.skills))
        .min(1)
        .required()
        .messages({
          'array.min': 'Please select at least one skill',
          'any.only': 'One or more selected skills are not recognized in our database',
          'any.required': 'Skills are required'
        }),

      interests: Joi.array()
        .items(Joi.string())
        .min(1)
        .required()
        .messages({
          'array.min': 'Please select at least one interest',
          'any.required': 'Interests are required'
        }),

      location: Joi.object({
        country: Joi.string().default('Kenya'),
        region: Joi.string().valid(...data.regions).required()
          .messages({ 
            'any.required': 'Please select your county',
            'any.only': 'Selected county not found in government records'
          }),
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
        .items(Joi.string().valid(...data.sectors))
        .min(1)
        .optional()
        .messages({
          'any.only': 'One or more selected sectors are not in KNBS classification'
        }),

      additionalInfo: Joi.string()
        .max(500)
        .optional(),
    });
  }

  /**
   * Validate business idea input with live data
   */
  async validateBusinessIdea(input) {
    const schema = await this.createBusinessIdeaSchema();
    
    // First validate with Joi
    const joiValidation = schema.validate(input, { abortEarly: false });
    
    if (joiValidation.error) {
      return {
        valid: false,
        errors: joiValidation.error.details.map(d => d.message)
      };
    }

    // Additional real-time validations
    const validatedData = joiValidation.value;
    const errors = [];

    // Validate location hierarchy if constituency/ward provided
    if (validatedData.location.constituency || validatedData.location.ward) {
      const locationValid = await validationDataService.validateLocation(
        validatedData.location.region,
        validatedData.location.constituency,
        validatedData.location.ward
      );

      if (!locationValid.valid) {
        errors.push(locationValid.message);
      }
    }

    // Validate skills with NITA
    for (const skill of validatedData.skills) {
      const skillValid = await validationDataService.validateSkill(skill);
      if (!skillValid.valid) {
        errors.push(`Skill '${skill}': ${skillValid.message}`);
      }
    }

    // Validate preferred sectors with KNBS
    if (validatedData.preferredSector) {
      for (const sector of validatedData.preferredSector) {
        const sectorValid = await validationDataService.validateSector(sector);
        if (!sectorValid.valid) {
          errors.push(`Sector '${sector}': ${sectorValid.message}`);
        }
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors
      };
    }

    return {
      valid: true,
      data: validatedData
    };
  }

  /**
   * Get all valid options for frontend dropdowns
   */
  async getValidationOptions() {
    const data = await this.getFreshValidationData();
    
    return {
      regions: data.regions,
      sectors: data.sectors_full,
      skills: data.skills_full,
      timeCommitments: ['full-time', 'part-time', 'weekend-only'],
      experienceLevels: ['none', 'beginner', 'intermediate', 'expert'],
      timestamp: data.timestamp
    };
  }
}

module.exports = new DynamicValidationService();