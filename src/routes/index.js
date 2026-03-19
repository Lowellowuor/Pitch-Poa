const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const businessRoutes = require('./business.routes');
const complianceRoutes = require('./compliance.routes');
const paymentRoutes = require('./payment.routes');

// Register routes
router.use('/auth', authRoutes);
router.use('/business', businessRoutes);
router.use('/compliance', complianceRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;
