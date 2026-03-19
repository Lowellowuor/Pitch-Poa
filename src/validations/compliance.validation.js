const Joi = require('joi');

const complianceValidation = {
  taxFiling: Joi.object({
    period: Joi.string().regex(/^\d{4}-\d{2}$/).required(),
    sales: Joi.number().positive().required(),
    purchases: Joi.number().min(0).required(),
    kraPin: Joi.string().length(11).required()
  }),
  
  businessRegistration: Joi.object({
    name: Joi.string().required(),
    kraPin: Joi.string().length(11).required(),
    businessType: Joi.string().valid('retail', 'wholesale', 'manufacturing').required()
  })
};

module.exports = complianceValidation;
