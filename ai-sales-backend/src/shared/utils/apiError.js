class ApiError extends Error {
  constructor(statusCode, message, errors = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    this.name = this.constructor.name;
    
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors = null) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden access') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }

  static unprocessableEntity(message = 'Unprocessable entity', errors = null) {
    return new ApiError(422, message, errors);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, null, false);
  }
}

module.exports = ApiError;