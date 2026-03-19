const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');
const { HTTP_STATUS } = require('../../config/constants');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error
  logger.error(`${error.statusCode || 500} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // If error is not an instance of ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Something went wrong';
    error = new ApiError(statusCode, message, error.errors, false);
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const message = `Duplicate value for ${field}. Please use another value.`;
    error = new ApiError(HTTP_STATUS.CONFLICT, message);
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(e => e.message);
    error = new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Validation error', errors);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    error = new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    error = new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Token expired');
  }

  const response = {
    success: false,
    message: error.message,
    timestamp: new Date().toISOString()
  };

  if (error.errors) {
    response.errors = error.errors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
};

module.exports = errorHandler;