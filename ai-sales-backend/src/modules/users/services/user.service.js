const User = require('../models/user.model');
const ApiError = require('../../../shared/utils/apiError');
const { HTTP_STATUS, USER_ROLES } = require('../../../config/constants');
const logger = require('../../../shared/utils/logger');

class UserService {
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw ApiError.conflict('User with this email already exists');
      }

      // Create new user
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phoneNumber: userData.phoneNumber,
        role: userData.role || USER_ROLES.CUSTOMER
      });

      logger.info(`New user registered: ${user.email} (${user.role})`);

      return user;
    } catch (error) {
      logger.error('Error in user registration:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      // Find user with password field
      const user = await User.findByEmailWithPassword(email);
      
      if (!user) {
        throw ApiError.unauthorized('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw ApiError.unauthorized('Your account has been deactivated. Please contact support.');
      }

      // Check password
      const isPasswordValid = await user.isPasswordCorrect(password);
      if (!isPasswordValid) {
        throw ApiError.unauthorized('Invalid email or password');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      // Generate token
      const token = user.generateAuthToken();

      logger.info(`User logged in: ${user.email}`);

      return { user, token };
    } catch (error) {
      logger.error('Error in user login:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Error in getUserById:', error);
      throw error;
    }
  }

  async getAllUsers(queryParams) {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        isActive,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = queryParams;

      // Build filter
      const filter = {};
      if (role) filter.role = role;
      if (isActive !== undefined) filter.isActive = isActive;
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const skip = (page - 1) * limit;
      
      const [users, total] = await Promise.all([
        User.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(filter)
      ]);

      return {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  async updateProfile(userId, updateData) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      // Update allowed fields
      if (updateData.name) user.name = updateData.name;
      if (updateData.phoneNumber) user.phoneNumber = updateData.phoneNumber;

      await user.save();

      logger.info(`User profile updated: ${user.email}`);

      return user;
    } catch (error) {
      logger.error('Error in updateProfile:', error);
      throw error;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with password field
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      // Verify current password
      const isPasswordValid = await user.isPasswordCorrect(currentPassword);
      if (!isPasswordValid) {
        throw ApiError.badRequest('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);

      return true;
    } catch (error) {
      logger.error('Error in changePassword:', error);
      throw error;
    }
  }

  async toggleUserStatus(userId, isActive) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      // Don't allow deactivating own account (check in controller)
      user.isActive = isActive;
      await user.save();

      logger.info(`User ${isActive ? 'activated' : 'deactivated'}: ${user.email}`);

      return user;
    } catch (error) {
      logger.error('Error in toggleUserStatus:', error);
      throw error;
    }
  }

  /**
   * OPTION 1: SOFT DELETE (Recommended)
   * This marks the user as deleted but keeps the record in database
   */
  async softDeleteUser(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      // Check if already deleted
      if (user.deletedAt) {
        throw ApiError.badRequest('User already deleted');
      }

      // Soft delete - set deletedAt timestamp and deactivate
      user.deletedAt = new Date();
      user.isActive = false;
      user.email = `${user.deletedAt.getTime()}_${user.email}`; // Make email unique if restoring later
      await user.save();

      logger.info(`User soft deleted: ${user.email} (ID: ${userId})`);

      return { 
        message: 'User deleted successfully',
        userId: user._id,
        deletedAt: user.deletedAt
      };
    } catch (error) {
      logger.error('Error in softDeleteUser:', error);
      throw error;
    }
  }

  /**
   * OPTION 2: HARD DELETE (Use with caution!)
   * This permanently removes the user from database
   */
  async hardDeleteUser(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      // Permanently delete user
      await User.findByIdAndDelete(userId);

      logger.info(`User hard deleted: ${user.email} (ID: ${userId})`);

      return { 
        message: 'User permanently deleted',
        userId
      };
    } catch (error) {
      logger.error('Error in hardDeleteUser:', error);
      throw error;
    }
  }

  /**
   * OPTION 3: HYBRID APPROACH (Most Professional)
   * Allows both soft and hard delete with configuration
   */
  async deleteUser(userId, permanent = false) {
    try {
      if (permanent) {
        return await this.hardDeleteUser(userId);
      } else {
        return await this.softDeleteUser(userId);
      }
    } catch (error) {
      logger.error('Error in deleteUser:', error);
      throw error;
    }
  }

  /**
   * Restore a soft-deleted user
   */
  async restoreUser(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      if (!user.deletedAt) {
        throw ApiError.badRequest('User is not deleted');
      }

      // Restore user - remove deletedAt and reactivate
      user.deletedAt = null;
      user.isActive = true;
      // Restore original email if it was modified
      if (user.email.includes('_')) {
        user.email = user.email.split('_').slice(1).join('_');
      }
      await user.save();

      logger.info(`User restored: ${user.email} (ID: ${userId})`);

      return user;
    } catch (error) {
      logger.error('Error in restoreUser:', error);
      throw error;
    }
  }

  /**
   * Get deleted users (for admin)
   */
  async getDeletedUsers(queryParams) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'deletedAt',
        sortOrder = 'desc'
      } = queryParams;

      const filter = { deletedAt: { $ne: null } };
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(filter)
      ]);

      return {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in getDeletedUsers:', error);
      throw error;
    }
  }
}

module.exports = UserService;