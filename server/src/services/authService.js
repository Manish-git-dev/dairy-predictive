const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const authService = {
  register: async (userData) => {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ApiError(400, 'Email already in use');
    }
    const user = new User(userData);
    await user.save();
    
    const token = authService.generateToken(user);
    return { user, token };
  },

  login: async (email, password) => {
    const user = await User.findOne({ email }).select('+password').populate('organization');
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    user.lastLogin = new Date();
    await user.save();

    // Remove password from response
    user.password = undefined;

    const token = authService.generateToken(user);
    return { user, token };
  },

  getCurrentUser: async (userId) => {
    const user = await User.findById(userId).populate('organization');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  },

  generateToken: (user) => {
    return jwt.sign(
      { id: user._id, role: user.role, organization: user.organization },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
  }
};

module.exports = authService;
