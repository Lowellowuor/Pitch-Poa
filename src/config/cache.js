const Redis = require('ioredis');
const logger = require('./logger');

let redisClient;

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis error:', err);
  });
} else {
  // Memory fallback for development
  const NodeCache = require('node-cache');
  redisClient = new NodeCache({ stdTTL: 600, checkperiod: 120 });
  logger.warn('Using in-memory cache (Redis not configured)');
}

// Cache wrapper for expensive operations
const cache = {
  async get(key, fetcher, ttl = 600) {
    try {
      // Try to get from cache
      let value;
      if (process.env.REDIS_URL) {
        value = await redisClient.get(key);
      } else {
        value = redisClient.get(key);
      }
      
      if (value) {
        return JSON.parse(value);
      }
      
      // If not in cache, fetch
      value = await fetcher();
      
      // Store in cache
      if (process.env.REDIS_URL) {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttl);
      } else {
        redisClient.set(key, JSON.stringify(value), ttl);
      }
      
      return value;
    } catch (error) {
      logger.error('Cache error:', error);
      // Fallback to direct fetch
      return fetcher();
    }
  },

  async invalidate(key) {
    try {
      if (process.env.REDIS_URL) {
        await redisClient.del(key);
      } else {
        redisClient.del(key);
      }
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  },

  async invalidatePattern(pattern) {
    try {
      if (process.env.REDIS_URL) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }
    } catch (error) {
      logger.error('Cache pattern invalidation error:', error);
    }
  }
};

module.exports = { redisClient, cache };
