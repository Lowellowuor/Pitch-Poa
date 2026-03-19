const app = require('./src/app');
const config = require('./src/config/environment');
const { connectDatabase, getDatabaseHealth } = require('./src/config/database');
const logger = require('./src/shared/utils/logger');

let server;

/**
 * Initialize and start the server
 */
const startServer = async () => {
  try {
    // Connect to database first
    await connectDatabase();
    
    // Start HTTP server
    server = app.listen(config.PORT, () => {
      logger.info({
        message: 'Server started successfully',
        port: config.PORT,
        environment: 'production',
        database: getDatabaseHealth(),
        timestamp: new Date().toISOString(),
      });
    });

    // Set server timeouts
    server.timeout = 120000; 
    server.keepAliveTimeout = 65000; 
    
    // Handle server errors
    server.on('error', (error) => {
      logger.error('Server error', {
        error: error.message,
        stack: error.stack,
      });
      
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.PORT} is already in use`);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal) => {
  logger.info({
    message: 'Received shutdown signal',
    signal,
  });

  // Stop accepting new requests
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  // Give existing requests 30 seconds to complete
  setTimeout(() => {
    logger.error('Forceful shutdown due to timeout');
    process.exit(1);
  }, 30000);

  // Exit after cleanup
  setTimeout(() => {
    logger.info('Graceful shutdown complete');
    process.exit(0);
  }, 1000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection', {
    error: error.message,
    stack: error.stack,
  });
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();

module.exports = server;