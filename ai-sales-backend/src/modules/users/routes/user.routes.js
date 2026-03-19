const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../../../shared/middlewares/auth');
const validate = require('../../../shared/middlewares/validate');
const { authLimiter, apiLimiter } = require('../../../shared/middlewares/rateLimiter');
const { upload } = require('../../../shared/middlewares/upload');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  userIdParamSchema,
  queryParamsSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateRoleSchema,
  emailSchema
} = require('../validations/user.validation');
const { USER_ROLES } = require('../../../config/constants');

// ==================== PUBLIC ROUTES ====================

// Health check for user service (no auth)
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'users',
    timestamp: new Date().toISOString() 
  });
});

// Authentication routes (with rate limiting)
router.post('/register', authLimiter, validate(registerSchema), userController.register);
router.post('/login', authLimiter, validate(loginSchema), userController.login);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), userController.forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(resetPasswordSchema), userController.resetPassword);
router.get('/verify-email/:token', authLimiter, userController.verifyEmail);

// ==================== PROTECTED ROUTES (Require Authentication) ====================

router.use(authenticate); // All routes below this require authentication

// Profile routes
router.get('/profile', userController.getProfile);
router.patch('/profile', validate(updateProfileSchema), userController.updateProfile);
router.post('/change-password', validate(changePasswordSchema), userController.changePassword);
router.post('/profile/picture', 
  upload.single('profilePicture'), 
  userController.uploadProfilePicture
);
router.post('/resend-verification', userController.resendVerification);
router.post('/logout', userController.logout);

// ==================== ADMIN ONLY ROUTES ====================

// User management routes (admin only)
router.get(
  '/',
  authorize(USER_ROLES.ADMIN),
  validate(queryParamsSchema, 'query'),
  userController.getAllUsers
);

router.get(
  '/deleted',
  authorize(USER_ROLES.ADMIN),
  validate(queryParamsSchema, 'query'),
  userController.getDeletedUsers
);

router.get(
  '/:id',
  authorize(USER_ROLES.ADMIN),
  validate(userIdParamSchema, 'params'),
  userController.getUserById
);

router.patch(
  '/:id/status',
  authorize(USER_ROLES.ADMIN),
  validate(userIdParamSchema, 'params'),
  userController.toggleUserStatus
);

router.patch(
  '/:id/role',
  authorize(USER_ROLES.ADMIN),
  validate(userIdParamSchema, 'params'),
  validate(updateRoleSchema),
  userController.updateUserRole
);

router.patch(
  '/:id/restore',
  authorize(USER_ROLES.ADMIN),
  validate(userIdParamSchema, 'params'),
  userController.restoreUser
);

router.delete(
  '/:id',
  authorize(USER_ROLES.ADMIN),
  validate(userIdParamSchema, 'params'),
  userController.deleteUser
);

// ==================== VENDOR ROUTES (Example of role-specific routes) ====================

router.get(
  '/vendors/stats',
  authorize(USER_ROLES.ADMIN, USER_ROLES.VENDOR),
  userController.getVendorStats // You'll need to implement this
);

module.exports = router;