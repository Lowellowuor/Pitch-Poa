const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../shared/middlewares/auth');
const validate = require('../../../shared/middlewares/validate');
const aiController = require('../controllers/ai.controller');
const { 
  predictionSchema, 
  recommendationSchema,
  optimizationSchema 
} = require('../validations/ai.validation');
const { USER_ROLES } = require('../../../config/constants');

// All AI routes require authentication
router.use(authenticate);

// Sales predictions
router.post(
  '/predict/sales',
  validate(predictionSchema),
  aiController.getSalesPredictions
);

// Product recommendations
router.get(
  '/recommendations/products',
  validate(recommendationSchema, 'query'),
  aiController.getProductRecommendations
);

// Price optimization (vendors and admins only)
router.post(
  '/optimize/price',
  authorize(USER_ROLES.VENDOR, USER_ROLES.ADMIN),
  validate(optimizationSchema),
  aiController.getPricingOptimization
);

// Customer behavior analysis (vendors and admins only)
router.get(
  '/analyze/customer/:customerId',
  authorize(USER_ROLES.VENDOR, USER_ROLES.ADMIN),
  aiController.analyzeCustomerBehavior
);

// Inventory predictions (vendors and admins only)
router.post(
  '/predict/inventory',
  authorize(USER_ROLES.VENDOR, USER_ROLES.ADMIN),
  aiController.getInventoryPredictions
);

module.exports = router;