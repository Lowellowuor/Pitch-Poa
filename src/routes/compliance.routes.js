/**
 * Compliance Routes
 * API endpoints for compliance management
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const complianceController = require('../controllers/compliance.controller');
const rateLimit = require('express-rate-limit');

// Rate limiting for compliance endpoints
const complianceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Apply auth to all compliance routes
router.use(auth);
router.use(complianceLimiter);

/**
 * @route   GET /api/compliance/check/:businessId
 * @desc    Perform full compliance check for a business
 * @access  Private (Business Owner, Admin)
 */
router.get(
  '/check/:businessId',
  [
    param('businessId').isMongoId().withMessage('Valid business ID required'),
    authorize('business:read')
  ],
  complianceController.checkCompliance
);

/**
 * @route   GET /api/compliance/dashboard/:businessId
 * @desc    Get compliance dashboard summary
 * @access  Private (Business Owner, Admin)
 */
router.get(
  '/dashboard/:businessId',
  [
    param('businessId').isMongoId().withMessage('Valid business ID required'),
    authorize('business:read')
  ],
  complianceController.getDashboard
);

/**
 * @route   POST /api/compliance/file/:businessId
 * @desc    File compliance report
 * @access  Private (Business Owner, Admin)
 */
router.post(
  '/file/:businessId',
  [
    param('businessId').isMongoId().withMessage('Valid business ID required'),
    body('reportType')
      .isIn(['tax_monthly', 'tax_annual', 'business_permit', 'social_contributions'])
      .withMessage('Valid report type required'),
    body('data').isObject().withMessage('Report data required'),
    authorize('business:write')
  ],
  complianceController.fileReport
);

/**
 * @route   GET /api/compliance/tax/:businessId/status
 * @desc    Get tax compliance status
 * @access  Private (Business Owner, Admin)
 */
router.get(
  '/tax/:businessId/status',
  [
    param('businessId').isMongoId().withMessage('Valid business ID required'),
    authorize('business:read')
  ],
  complianceController.getTaxStatus
);

/**
 * @route   POST /api/compliance/tax/:businessId/file/monthly
 * @desc    File monthly tax return
 * @access  Private (Business Owner, Admin)
 */
router.post(
  '/tax/:businessId/file/monthly',
  [
    param('businessId').isMongoId().withMessage('Valid business ID required'),
    body('period').matches(/^\d{4}-\d{2}$/).withMessage('Valid period required (YYYY-MM)'),
    body('sales').isNumeric().withMessage('Sales amount required'),
    body('purchases').isNumeric().withMessage('Purchases amount required'),
    body('kraPin').notEmpty().withMessage('KRA PIN required'),
    authorize('business:write')
  ],
  complianceController.fileMonthlyTax
);

/**
 * @route   POST /api/compliance/tax/:businessId/file/annual
 * @desc    File annual tax return
 * @access  Private (Business Owner, Admin)
 */
router.post(
  '/tax/:businessId/file/annual',
  [
    param('businessId').isMongoId().withMessage('Valid business ID required'),
    body('year').isInt({ min: 2020, max: 2100 }).withMessage('Valid year required'),
    body('grossIncome').isNumeric().withMessage('Gross income required'),
    body('taxableIncome').isNumeric().withMessage('Taxable income required'),
    body('kraPin').notEmpty().withMessage('KRA PIN required'),
    authorize('business:write')
  ],
  complianceController.fileAnnualTax
);

/**
 * @route   GET /api/compliance/permits/:businessId
 * @desc    Get business permits
 * @access  Private (Business Owner, Admin)
 */
router.get(
  '/permits/:businessId',
  [
    param('businessId').isMongoId().withMessage('Valid business ID required'),
    authorize('business:read')
  ],
  complianceController.getBusinessPermits
);

/**
 * @route   POST /api/compliance/permits/:businessId/renew
 * @desc    Renew business permit
 * @access  Private (Business Owner, Admin)
 */
router.post(
  '/permits/:businessId/renew',
  [
    param('businessId').isMongoId().withMessage('Valid business ID required'),
    body('permitId').isMongoId().withMessage('Permit ID required'),
    body('renewalData').isObject().withMessage('Renewal data required'),
    authorize('business:write')
  ],
  complianceController.renewPermit
);

/**
 * @route   GET /api/compliance/deadlines/:businessId
 * @desc    Get upcoming compliance deadlines
 * @access  Private (Business Owner, Admin)
 */
router.get(
  '/deadlines/:businessId',
  [
    param('businessId').isMongoId().withMessage('Valid business ID required'),
    query('days').optional().isInt({ min: 1, max: 90 }).withMessage('Days must be between 1 and 90'),
    authorize('business:read')
  ],
  complianceController.getUpcomingDeadlines
);

/**
 * @route   GET /api/compliance/history/:businessId
 * @desc    Get compliance history
 * @access  Private (Business Owner, Admin)
 */
router.get(
  '/history/:businessId',
  [
    param('businessId').isMongoId().withMessage('Valid business ID required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    authorize('business:read')
  ],
  complianceController.getComplianceHistory
);

/**
 * @route   GET /api/compliance/tax/:businessId/history
 * @desc    Get tax filing history
 * @access  Private (Business Owner, Admin)
 */
router.get(
  '/tax/:businessId/history',
  [
    param('businessId').isMongoId().withMessage('Valid business ID required'),
    query('type').optional().isIn(['vat', 'income_tax', 'withholding_tax', 'paye']),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    authorize('business:read')
  ],
  complianceController.getTaxHistory
);

/**
 * @route   GET /api/compliance/tax/:businessId/calculations
 * @desc    Calculate tax estimates
 * @access  Private (Business Owner, Admin)
 */
router.post(
  '/tax/:businessId/calculations',
  [
    param('businessId').isMongoId().withMessage('Valid business ID required'),
    body('type').isIn(['vat', 'income_tax', 'withholding', 'paye', 'turnover']),
    body('data').isObject().withMessage('Calculation data required'),
    authorize('business:read')
  ],
  complianceController.calculateTax
);

/**
 * @route   GET /api/compliance/alerts/:businessId
 * @desc    Get compliance alerts
 * @access  Private (Business Owner, Admin)
 */
router.get(
  '/alerts/:businessId',
  [
    param('businessId').isMongoId().withMessage('Valid business ID required'),
    query('includeDismissed').optional().isBoolean(),
    authorize('business:read')
  ],
  complianceController.getAlerts
);

/**
 * @route   POST /api/compliance/alerts/:alertId/dismiss
 * @desc    Dismiss a compliance alert
 * @access  Private (Business Owner, Admin)
 */
router.post(
  '/alerts/:alertId/dismiss',
  [
    param('alertId').isMongoId().withMessage('Valid alert ID required'),
    authorize('business:write')
  ],
  complianceController.dismissAlert
);

/**
 * @route   GET /api/compliance/audit/:businessId
 * @desc    Get audit logs (for data protection)
 * @access  Private (Admin only)
 */
router.get(
  '/audit/:businessId',
  [
    param('businessId').isMongoId().withMessage('Valid business ID required'),
    query('days').optional().isInt({ min: 1, max: 90 }),
    authorize('admin')
  ],
  complianceController.getAuditLogs
);

/**
 * @route   POST /api/compliance/data-protection/consent
 * @desc    Record user consent for data processing
 * @access  Private
 */
router.post(
  '/data-protection/consent',
  [
    body('purpose').notEmpty().withMessage('Consent purpose required'),
    body('granted').isBoolean().withMessage('Consent granted status required'),
    authorize('user')
  ],
  complianceController.recordConsent
);

/**
 * @route   POST /api/compliance/data-protection/deletion-request
 * @desc    Request data deletion (GDPR/Data Protection Act)
 * @access  Private
 */
router.post(
  '/data-protection/deletion-request',
  [
    body('reason').optional().isString(),
    authorize('user')
  ],
  complianceController.requestDataDeletion
);

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Apply validation to all routes
router.use(validate);

module.exports = router;