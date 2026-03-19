/**
 * HTTP Client Utility
 * Wrapper around axios with retry logic and error handling
 */

const axios = require('axios');
const logger = require('../../config/logger');
const { retry } = require('../config/integrations.config');

class HttpClient {
  constructor(baseURL, defaultHeaders = {}) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...defaultHeaders
      }
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`HTTP Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('HTTP Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`HTTP Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const { config, response } = error;
        
        if (!config || !config.retry) {
          return Promise.reject(error);
        }

        config.retryCount = config.retryCount || 0;

        if (config.retryCount >= retry.maxAttempts) {
          logger.error(`Max retry attempts reached for ${config.url}`);
          return Promise.reject(error);
        }

        config.retryCount += 1;
        
        const delay = this.calculateBackoff(config.retryCount);
        logger.info(`Retrying request to ${config.url} (attempt ${config.retryCount}/${retry.maxAttempts}) after ${delay}ms`);

        await this.sleep(delay);
        return this.client(config);
      }
    );
  }

  calculateBackoff(attempt) {
    const delay = retry.initialDelay * Math.pow(retry.backoffFactor, attempt - 1);
    return Math.min(delay, retry.maxDelay);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get(url, config = {}) {
    try {
      const response = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async post(url, data = {}, config = {}) {
    try {
      const response = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async put(url, data = {}, config = {}) {
    try {
      const response = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error status
      logger.error('API Response Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
      throw new IntegrationError(
        error.response.data?.message || 'External service error',
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      // Request made but no response
      logger.error('No response from external service:', error.request);
      throw new IntegrationError('External service unavailable', 503);
    } else {
      // Request setup error
      logger.error('Request configuration error:', error.message);
      throw new IntegrationError('Integration request failed', 500);
    }
  }
}

class IntegrationError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.name = 'IntegrationError';
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

module.exports = { HttpClient, IntegrationError };