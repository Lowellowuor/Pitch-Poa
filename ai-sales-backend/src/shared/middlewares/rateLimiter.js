const rateLimit = require('express-rate-limit');
const { ApiError } = require('./auth');

//  rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // General API rate limit
  api: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 600000, 
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Authentication endpoints (stricter)
  auth: {
    windowMs: 900000, 
    max: 10, 
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true, 
  },
  
  // AI endpoints (based on API limits)
  ai: {
    windowMs: 60000, 
    max: 30, 
    message: 'AI service rate limit exceeded, please slow down.',
  },
};

/**
 * Create custom rate limiter
 */
const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      message: options.message || 'Too many requests',
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip;
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/ready' || req.path === '/live';
    },
    handler: (req, res, next, options) => {
      // Log rate limit hits
      console.warn('Rate limit exceeded', {
        ip: req.ip,
        userId: req.user?.id,
        path: req.path,
      });
      
      next(new ApiError(429, options.message));
    },
    ...options,
  });
};

// Pre-configured limiters
const apiLimiter = createRateLimiter(RATE_LIMIT_CONFIG.api);
const authLimiter = createRateLimiter(RATE_LIMIT_CONFIG.auth);
const aiLimiter = createRateLimiter(RATE_LIMIT_CONFIG.ai);

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
  createRateLimiter,
  RATE_LIMIT_CONFIG,
};