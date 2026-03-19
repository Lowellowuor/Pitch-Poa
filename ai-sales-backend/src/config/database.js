const mongoose = require('mongoose');
const { MONGODB_URI, NODE_ENV } = require('./environment');
const logger = require('../shared/utils/logger');

//  connection options
const connectionOptions = {
  maxPoolSize: 100,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
  
  // Timeouts 
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 15000,
  heartbeatFrequencyMS: 10000,
  
  // Write concern 
  w: 'majority',
  wtimeoutMS: 5000,
  journal: true,
  
  // Read preference 
  readPreference: 'primary',
  
  // Retry logic
  retryWrites: true,
  retryReads: true,
  
  // TLS/SSL 
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  
  // Compression 
  compressors: ['snappy', 'zlib'],
  autoIndex: false,
  autoCreate: false,
};

let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;

/**
 *  database connection with failover
 */
const connectDatabase = async () => {
  if (isConnected) {
    logger.info('Using existing database connection');
    return mongoose.connection;
  }

  try {
    logger.info('Establishing database connection...');
    
    const connection = await mongoose.connect(MONGODB_URI, connectionOptions);
    
    isConnected = true;
    connectionRetries = 0;
    
    logger.info('Database connected successfully', {
      host: connection.connection.host,
      database: connection.connection.name,
      poolSize: connectionOptions.maxPoolSize,
    });

    setupConnectionHandlers();
    
    return connection;
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message,
      retryCount: connectionRetries,
    });

    if (connectionRetries < MAX_RETRIES) {
      connectionRetries++;
      const delay = Math.min(1000 * Math.pow(2, connectionRetries), 30000);
      
      logger.info(`Retrying connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return connectDatabase();
    }

    // If all retries failed, exit the process
    logger.error('Max database connection retries reached. Exiting...');
    process.exit(1);
  }
};

/**
 * Setup connection monitoring
 */
const setupConnectionHandlers = () => {
  mongoose.connection.on('error', (error) => {
    logger.error('Database connection error', { error: error.message });
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('Database disconnected');
    isConnected = false;
    
    // Attempt to reconnect
    setTimeout(() => {
      if (!isConnected) {
        logger.info('Attempting database reconnection...');
        connectDatabase().catch(err => {
          logger.error('Reconnection failed', { error: err.message });
        });
      }
    }, 5000);
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('Database reconnected successfully');
    isConnected = true;
  });

  // Handle process termination
  process.on('SIGTERM', async () => {
    await disconnectDatabase();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await disconnectDatabase();
    process.exit(0);
  });
};

/**
 * Graceful database disconnection
 */
const disconnectDatabase = async () => {
  if (!isConnected) {
    return;
  }

  try {
    logger.info('Closing database connections...');
    
    await mongoose.disconnect();
    
    isConnected = false;
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting database', { error: error.message });
    throw error;
  }
};

/**
 * Get database health status
 */
const getDatabaseHealth = () => {
  const state = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  
  return {
    status: states[state] || 'unknown',
    state,
    host: mongoose.connection.host,
    database: mongoose.connection.name,
    poolSize: connectionOptions.maxPoolSize,
  };
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getDatabaseHealth,
};