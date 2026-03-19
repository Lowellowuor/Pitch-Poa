const { ApiError } = require('./auth');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    if (!schema) {
      return next(new ApiError(500, 'Validation schema not provided.'));
    }

    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      errors: {
        wrap: { label: '' },
      },
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      // Log validation errors for monitoring
      console.debug('Validation failed', {
        property,
        errors,
        path: req.path,
        method: req.method,
      });

      return next(new ApiError(422, 'Validation failed', { errors }));
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

/**
 * Create validation schema for MongoDB ObjectId
 */
const validateObjectId = (id, helpers) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(id)) {
    return helpers.error('any.invalid', { message: 'Invalid ID format' });
  }
  return id;
};

/**
 * Create validation schema for email
 */
const validateEmail = (email, helpers) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return helpers.error('any.invalid', { message: 'Invalid email format' });
  }
  return email;
};

/**
 * Create validation schema for password strength
 */
const validatePassword = (password, helpers) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return helpers.error('any.invalid', { 
      message: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character' 
    });
  }
  return password;
};

module.exports = validate;
module.exports.validateObjectId = validateObjectId;
module.exports.validateEmail = validateEmail;
module.exports.validatePassword = validatePassword;