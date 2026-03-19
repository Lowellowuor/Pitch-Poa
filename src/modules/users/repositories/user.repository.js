const User = require('../models/user.model');

class UserRepository {
  async create(userData) {
    return User.create(userData);
  }

  async findById(id, options = {}) {
    return User.findById(id).select(options.select);
  }

  async findByEmail(email, options = {}) {
    return User.findOne({ email }).select(options.select);
  }

  async findAll(filter = {}, options = {}) {
    const { sort = {}, skip = 0, limit = 10, select } = options;
    return User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select(select)
      .lean();
  }

  async count(filter = {}) {
    return User.countDocuments(filter);
  }

  async updateById(id, updateData, options = {}) {
    return User.findByIdAndUpdate(id, updateData, { new: true, ...options });
  }

  async deleteById(id) {
    return User.findByIdAndDelete(id);
  }
}

module.exports = UserRepository;