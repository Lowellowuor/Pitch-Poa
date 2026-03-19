const express = require('express');
const config = require('./config');
const logger = require('./config/logger');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1', require('./routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(require('./middleware/errorHandler'));

module.exports = app;
