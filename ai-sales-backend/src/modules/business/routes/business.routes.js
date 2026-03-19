const express = require('express');
const router = express.Router();
const ideaController = require('../controllers/idea.controller');
const { authenticate } = require('../../../shared/middlewares/auth');

// Public route for validation options (no auth needed for dropdowns)
router.get('/validation-options', ideaController.getValidationOptions);

// Protected routes
router.use(authenticate);
router.post('/ideas/generate', ideaController.generateIdeas);
router.post('/validate/location', ideaController.validateLocation);
router.post('/validate/skill', ideaController.validateSkill);

module.exports = router;