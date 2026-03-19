/**
 * Production-ready async handler to eliminate try-catch blocks in controllers
 * Automatically catches errors and passes them to Express error handler
 */

/**
 * Wraps an async function and catches any errors, passing them to next()
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    // Ensure fn returns a promise and catch any errors
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Log error for monitoring (optional - can be removed if logger is not available)
      if (process.env.NODE_ENV === 'production' && console.error) {
        console.error('Async Handler Caught Error:', {
          message: error.message,
          stack: error.stack,
          path: req.path,
          method: req.method,
          userId: req.user?.id,
        });
      }
      
      // Pass error to Express error handler
      next(error);
    });
  };
};

/**
 * Alternative version with additional features
 * Use this if you need more control
 */
const asyncHandlerAdvanced = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .then((result) => {
        // Optional: You can add response formatting here if needed
        return result;
      })
      .catch((error) => {
        // Add context to error
        error.path = req.path;
        error.method = req.method;
        error.timestamp = new Date().toISOString();
        
        // Log error (if logger is available)
        if (req.logger) {
          req.logger.error('Request failed', {
            error: error.message,
            path: req.path,
            method: req.method,
          });
        }
        
        next(error);
      });
  };
};

/**
 * Wraps an array of middleware functions with asyncHandler
 * @param {Array} middlewares - Array of middleware functions
 * @returns {Array} Array of wrapped middleware functions
 */
const wrapMiddlewareArray = (middlewares) => {
  return middlewares.map(middleware => {
    if (typeof middleware === 'function') {
      return asyncHandler(middleware);
    }
    return middleware;
  });
};

module.exports = asyncHandler;
module.exports.asyncHandlerAdvanced = asyncHandlerAdvanced;
module.exports.wrapMiddlewareArray = wrapMiddlewareArray;