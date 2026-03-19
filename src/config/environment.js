// Only load dotenv in non-container environments
if (!process.env.NODE_ENV) {
  require('dotenv').config();
}

// environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI',
  'AI_SERVICE_API_KEY',
  'CLIENT_URL',
];

// Validate all required variables are present
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`FATAL ERROR: Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

// JWT secret strength validation
if (process.env.JWT_SECRET.length < 32) {
  console.error('FATAL ERROR: JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

//  configuration
const config = Object.freeze({
  // Server
  NODE_ENV: 'production',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  API_VERSION: process.env.API_VERSION || 'v1',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // External AI Service
  AI_SERVICE_API_URL: process.env.AI_SERVICE_API_URL || 'https://api.ai-service.com/v1',
  AI_SERVICE_API_KEY: process.env.AI_SERVICE_API_KEY,
  AI_SERVICE_TIMEOUT: parseInt(process.env.AI_SERVICE_TIMEOUT, 10) || 30000,
  
  // CORS
  CLIENT_URL: process.env.CLIENT_URL,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : [process.env.CLIENT_URL],
  
  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 600000, // 10 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  
  // Email (SMTP)
  SMTP: {
    HOST: process.env.SMTP_HOST,
    PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    SECURE: process.env.SMTP_SECURE === 'true',
    USER: process.env.SMTP_USER,
    PASS: process.env.SMTP_PASS,
    FROM: process.env.SMTP_FROM || 'noreply@ai-sales.com',
  },
  
  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  
  // File Upload
  UPLOAD: {
    MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 5 * 1024 * 1024,
    ALLOWED_TYPES: process.env.UPLOAD_ALLOWED_TYPES 
      ? process.env.UPLOAD_ALLOWED_TYPES.split(',') 
      : ['image/jpeg', 'image/png', 'image/jpg'],
    STORAGE_PATH: process.env.UPLOAD_STORAGE_PATH || '/var/data/uploads',
  },
  
  // Redis (optional)
  REDIS_URL: process.env.REDIS_URL,
  
  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN,
  NEW_RELIC_LICENSE_KEY: process.env.NEW_RELIC_LICENSE_KEY,
});

module.exports = config;