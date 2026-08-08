const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const ApiError = require('../utils/ApiError');

const authService = {
  register: async (userData) => {
    if (process.env.ALLOW_PUBLIC_REGISTRATION !== 'true') {
      throw new ApiError(403, 'Public registration is disabled');
    }

    const organizationId = process.env.REGISTRATION_ORGANIZATION_ID;
    if (!organizationId) {
      throw new ApiError(503, 'Registration is not configured');
    }

    const organization = await Organization.findOne({ _id: organizationId, isActive: true }).select('_id');
    if (!organization) {
      throw new ApiError(503, 'Registration is not configured');
    }

    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ApiError(400, 'Email already in use');
    }

    // Public signup can never self-assign an elevated role or tenant.
    const user = new User({
      ...userData,
      role: 'field_staff',
      organization: organization._id
    });
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

    if (!user.isActive || !user.organization?.isActive) {
      throw new ApiError(401, 'Invalid credentials');
    }

    user.lastLogin = new Date();
    await user.save();

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
    if (!process.env.JWT_SECRET) {
      throw new ApiError(500, 'Authentication service is not configured');
    }

    return jwt.sign(
      { id: user._id.toString(), role: user.role, organization: user.organization?._id || user.organization },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
  }
};

module.exports = authService;
