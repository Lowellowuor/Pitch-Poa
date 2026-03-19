const UserService = require('../services/user.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');
const { UserDTO, UserProfileDTO, UserListDTO, UserDetailsDTO } = require('../dtos/user.dto');

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  /**
   * @desc    Register a new user
   * @route   POST /api/v1/users/register
   * @access  Public
   */
  register = asyncHandler(async (req, res) => {
    const userData = req.body;
    const result = await this.userService.register(userData);
    
    return ApiResponse.created(res, {
      user: UserProfileDTO.fromDocument(result.user),
      token: result.token
    }, 'User registered successfully');
  });

  /**
   * @desc    Login user
   * @route   POST /api/v1/users/login
   * @access  Public
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await this.userService.login(email, password);
    
    return ApiResponse.success(res, {
      user: UserProfileDTO.fromDocument(result.user),
      token: result.token
    }, 'Login successful');
  });

  /**
   * @desc    Get current user profile
   * @route   GET /api/v1/users/profile
   * @access  Private
   */
  getProfile = asyncHandler(async (req, res) => {
    const user = await this.userService.getUserById(req.user.id);
    return ApiResponse.success(res, UserProfileDTO.fromDocument(user), 'Profile retrieved successfully');
  });

  /**
   * @desc    Update user profile
   * @route   PATCH /api/v1/users/profile
   * @access  Private
   */
  updateProfile = asyncHandler(async (req, res) => {
    const user = await this.userService.updateProfile(req.user.id, req.body);
    return ApiResponse.success(res, UserProfileDTO.fromDocument(user), 'Profile updated successfully');
  });

  /**
   * @desc    Change password
   * @route   POST /api/v1/users/change-password
   * @access  Private
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await this.userService.changePassword(req.user.id, currentPassword, newPassword);
    return ApiResponse.success(res, null, 'Password changed successfully');
  });

  /**
   * @desc    Upload profile picture
   * @route   POST /api/v1/users/profile/picture
   * @access  Private
   */
  uploadProfilePicture = asyncHandler(async (req, res) => {
    if (!req.file) {
      return ApiResponse.error(res, { message: 'No file uploaded', statusCode: 400 });
    }
    
    const user = await this.userService.uploadProfilePicture(req.user.id, req.file);
    return ApiResponse.success(res, { profilePicture: user.profilePicture }, 'Profile picture uploaded successfully');
  });

  /**
   * @desc    Get all users (admin only)
   * @route   GET /api/v1/users
   * @access  Private/Admin
   */
  getAllUsers = asyncHandler(async (req, res) => {
    const { users, pagination } = await this.userService.getAllUsers(req.query);
    return ApiResponse.paginated(
      res, 
      UserListDTO.fromArray(users), 
      pagination.page, 
      pagination.limit, 
      pagination.total,
      'Users retrieved successfully'
    );
  });

  /**
   * @desc    Get user by ID (admin only)
   * @route   GET /api/v1/users/:id
   * @access  Private/Admin
   */
  getUserById = asyncHandler(async (req, res) => {
    const user = await this.userService.getUserById(req.params.id);
    return ApiResponse.success(res, UserDetailsDTO.fromDocument(user), 'User retrieved successfully');
  });

  /**
   * @desc    Toggle user active status (admin only)
   * @route   PATCH /api/v1/users/:id/status
   * @access  Private/Admin
   */
  toggleUserStatus = asyncHandler(async (req, res) => {
    const { isActive } = req.body;
    
    // Prevent admin from deactivating themselves
    if (req.params.id === req.user.id) {
      return ApiResponse.error(res, { 
        message: 'You cannot deactivate your own account', 
        statusCode: 400 
      });
    }
    
    const user = await this.userService.toggleUserStatus(req.params.id, isActive);
    return ApiResponse.success(res, UserListDTO.fromDocument(user), `User ${isActive ? 'activated' : 'deactivated'} successfully`);
  });

  /**
   * @desc    Delete user (soft delete by default, hard delete with ?permanent=true)
   * @route   DELETE /api/v1/users/:id
   * @access  Private/Admin
   */
  deleteUser = asyncHandler(async (req, res) => {
    const { permanent } = req.query;
    
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return ApiResponse.error(res, { 
        message: 'You cannot delete your own account', 
        statusCode: 400 
      });
    }
    
    const result = await this.userService.deleteUser(
      req.params.id, 
      req.user.id, // Who is performing the delete
      permanent === 'true'
    );
    
    const message = permanent === 'true' 
      ? 'User permanently deleted' 
      : 'User deleted successfully';
    
    return ApiResponse.success(res, result, message);
  });

  /**
   * @desc    Restore soft-deleted user (admin only)
   * @route   PATCH /api/v1/users/:id/restore
   * @access  Private/Admin
   */
  restoreUser = asyncHandler(async (req, res) => {
    const user = await this.userService.restoreUser(req.params.id);
    return ApiResponse.success(res, UserDTO.fromDocument(user), 'User restored successfully');
  });

  /**
   * @desc    Get deleted users (admin only)
   * @route   GET /api/v1/users/deleted
   * @access  Private/Admin
   */
  getDeletedUsers = asyncHandler(async (req, res) => {
    const { users, pagination } = await this.userService.getDeletedUsers(req.query);
    return ApiResponse.paginated(
      res,
      UserListDTO.fromArray(users),
      pagination.page,
      pagination.limit,
      pagination.total,
      'Deleted users retrieved successfully'
    );
  });

  /**
   * @desc    Update user role (admin only)
   * @route   PATCH /api/v1/users/:id/role
   * @access  Private/Admin
   */
  updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    
    // Prevent admin from changing their own role
    if (req.params.id === req.user.id) {
      return ApiResponse.error(res, { 
        message: 'You cannot change your own role', 
        statusCode: 400 
      });
    }
    
    const user = await this.userService.updateUserRole(req.params.id, role);
    return ApiResponse.success(res, UserDTO.fromDocument(user), 'User role updated successfully');
  });

  /**
   * @desc    Logout user (client-side token removal)
   * @route   POST /api/v1/users/logout
   * @access  Private
   */
  logout = asyncHandler(async (req, res) => {
    // In a stateless JWT setup, logout is handled client-side
    // But you can implement token blacklisting here if needed
    return ApiResponse.success(res, null, 'Logged out successfully');
  });

  /**
   * @desc    Request password reset
   * @route   POST /api/v1/users/forgot-password
   * @access  Public
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    await this.userService.forgotPassword(email);
    return ApiResponse.success(res, null, 'Password reset email sent if account exists');
  });

  /**
   * @desc    Reset password with token
   * @route   POST /api/v1/users/reset-password/:token
   * @access  Public
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    await this.userService.resetPassword(token, password);
    return ApiResponse.success(res, null, 'Password reset successfully');
  });

  /**
   * @desc    Verify email with token
   * @route   GET /api/v1/users/verify-email/:token
   * @access  Public
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;
    await this.userService.verifyEmail(token);
    return ApiResponse.success(res, null, 'Email verified successfully');
  });

  /**
   * @desc    Resend verification email
   * @route   POST /api/v1/users/resend-verification
   * @access  Private
   */
  resendVerification = asyncHandler(async (req, res) => {
    await this.userService.resendVerificationEmail(req.user.id);
    return ApiResponse.success(res, null, 'Verification email sent');
  });
}

module.exports = new UserController();