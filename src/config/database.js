const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async (retries = 5) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: process.env.NODE_ENV === 'development',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(MongoDB Connected: );

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    logger.error(Database connection error: );
    
    if (retries > 0) {
      logger.info(Retrying connection... ( attempts left));
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      logger.error('Could not connect to database. Exiting...');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
