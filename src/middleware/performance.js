const responseTime = require('response-time');
const logger = require('../config/logger');

const performanceMonitor = responseTime((req, res, time) => {
  const metrics = {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    responseTime: time.toFixed(2),
    timestamp: new Date().toISOString()
  };

  // Log slow requests
  if (time > 1000) {
    logger.warn('Slow request detected', metrics);
  }

  // Store metrics for monitoring
  if (process.env.NODE_ENV === 'production') {
    // Send to monitoring service (Datadog, New Relic, etc.)
  }
});

// Track active connections
let activeConnections = 0;

const trackConnections = (req, res, next) => {
  activeConnections++;
  
  res.on('finish', () => {
    activeConnections--;
  });
  
  // Add to request for access in other middleware
  req.activeConnections = activeConnections;
  
  next();
};

// Get active connections count
const getActiveConnections = () => activeConnections;

module.exports = { 
  performanceMonitor, 
  trackConnections, 
  getActiveConnections 
};
