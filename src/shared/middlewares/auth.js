const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('../../config/environment');
const logger = require('../utils/logger');

// Custom ApiError class (if not exists, create it)
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required. No token provided.');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'Invalid token format.');
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    // Check if token has required fields
    if (!decoded.id || !decoded.email || !decoded.role) {
      throw new ApiError(401, 'Invalid token payload.');
    }

    // Check if user still exists (you can implement this with your User model)
    // const user = await User.findById(decoded.id).select('-password');
    // if (!user) {
    //   throw new ApiError(401, 'User no longer exists.');
    // }
    
    // if (!user.isActive) {
    //   throw new ApiError(401, 'Account is deactivated.');
    // }

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    logger.debug('User authenticated', { userId: decoded.id, role: decoded.role });
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token.'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired. Please login again.'));
    }

    next(error);
  }
};

/**
 * Authorization middleware - checks user roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
      });

      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }

    next();
  };
};

/**
 * Optional authentication - doesn't error if no token
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        const decoded = jwt.verify(token, config.JWT_SECRET, {
          algorithms: ['HS256'],
          ignoreExpiration: false,
        });

        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        };
      }
    }
    
    next();
  } catch (error) {
    // Token invalid but we don't throw error for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuthenticate,
  ApiError, // Export for convenience
};