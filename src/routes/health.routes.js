const express = require('express');
const mongoose = require('mongoose');
const os = require('os');
const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/health', async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    services: {
      database: {
        status: mongoose.connection.readyState === 1 ? 'up' : 'down',
        responseTime: null
      }
    },
    system: {
      memory: process.memoryUsage(),
      cpu: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem()
    }
  };

  // Check database response time
  const dbStart = Date.now();
  try {
    await mongoose.connection.db.admin().ping();
    healthcheck.services.database.responseTime = Date.now() - dbStart;
  } catch (error) {
    healthcheck.services.database.status = 'down';
    healthcheck.services.database.error = error.message;
  }

  const allServicesUp = Object.values(healthcheck.services)
    .every(s => s.status === 'up');

  res.status(allServicesUp ? 200 : 503).json(healthcheck);
});

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Prometheus metrics endpoint
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Metrics in Prometheus format
 */
router.get('/metrics', (req, res) => {
  // Expose Prometheus metrics
  const metrics = [
    '# HELP http_requests_total Total HTTP requests',
    '# TYPE http_requests_total counter',
    'http_requests_total 0',
    '',
    '# HELP http_request_duration_seconds HTTP request duration',
    '# TYPE http_request_duration_seconds histogram',
    'http_request_duration_seconds_bucket{le="0.1"} 0',
    'http_request_duration_seconds_bucket{le="0.5"} 0',
    'http_request_duration_seconds_bucket{le="1"} 0',
    'http_request_duration_seconds_bucket{le="+Inf"} 0',
    'http_request_duration_seconds_count 0',
    '',
    '# HELP active_connections Active connections',
    '# TYPE active_connections gauge',
    'active_connections 0'
  ].join('\n');
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

module.exports = router;
