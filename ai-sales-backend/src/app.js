const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');

const config = require('./config/environment');
const logger = require('./shared/utils/logger');
const errorHandler = require('./shared/middlewares/errorHandler');
const { apiLimiter, authLimiter } = require('./shared/middlewares/rateLimiter');

// Import routes
const userRoutes = require('./modules/users/routes/user.routes');
const aiRoutes = require('./modules/ai/routes/ai.routes'); 

const app = express();

// ==================== PRODUCTION SECURITY & PERFORMANCE ====================

// Trust proxy - essential for production behind load balancers
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

// Security headers with strict production configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", config.CLIENT_URL],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'same-origin' },
  noSniff: true,
  xssFilter: true,
}));

// Production compression
app.use(compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Compress responses larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

// Strict CORS for production
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = config.ALLOWED_ORIGINS;
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('Blocked request from unauthorized origin', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 86400, // Preflight cache for 24 hours
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
}));

// Body parsing with strict limits
app.use(express.json({ 
  limit: '5mb',
  strict: true,
  verify: (req, res, buf) => {
    // Optional: Add request body validation
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '5mb',
  parameterLimit: 1000, // Maximum number of parameters
}));

// logging with structured JSON
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      logger.info('HTTP Request', {
        method: message.split(' ')[0],
        url: message.split(' ')[1],
        status: message.split(' ')[3],
        responseTime: message.split(' ')[4],
      });
    },
  },
  skip: (req) => req.path === '/health' || req.path === '/live' || req.path === '/ready', // Skip health check logs
}));

// Static files with p caching
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '7d', // Cache for 7 days
  etag: true,
  lastModified: true,
  immutable: true,
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

// ====================  HEALTH CHECKS ====================

// Liveness probe - for container orchestration
app.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Readiness probe - checks database connectivity
app.get('/ready', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  
  const health = {
    status: dbState === 1 ? 'ready' : 'not ready',
    timestamp: new Date().toISOString(),
    database: {
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown',
      connected: dbState === 1,
    },
    memory: process.memoryUsage(),
  };

  if (dbState === 1) {
    res.status(200).json(health);
  } else {
    res.status(503).json(health);
  }
});

// Detailed health check for monitoring systems
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  
  res.status(200).json({
    service: 'ai-sales-backend',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'production',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    metrics: {
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      },
      database: {
        connected: dbState === 1,
        state: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState],
        poolSize: 100,
      },
    },
  });
});

// ==================== API ROUTES ====================

// API versioning
const API_PREFIX = `/api/${config.API_VERSION}`;

// Apply rate limiting to all API routes
app.use(API_PREFIX, apiLimiter);

// Public routes (with stricter rate limiting for auth)
app.post(`${API_PREFIX}/auth/login`, authLimiter);
app.post(`${API_PREFIX}/auth/register`, authLimiter);
app.post(`${API_PREFIX}/auth/forgot-password`, authLimiter);
app.post(`${API_PREFIX}/auth/reset-password`, authLimiter);

// Mount feature routes
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);

// ==================== 404 HANDLER ====================

app.use('*', (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

// ==================== GLOBAL ERROR HANDLER ====================

app.use(errorHandler);

// ==================== EXPORTS ====================

module.exports = app;