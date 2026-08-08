const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { hasAnyRole, isValidRole } = require('../config/authorization');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided or invalid format');
    }

    if (!process.env.JWT_SECRET) {
      throw new ApiError(500, 'Authentication service is not configured');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new ApiError(401, 'No token provided or invalid format');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new ApiError(401, 'Token is invalid or expired');
    }

    if (!decoded || !decoded.id) {
      throw new ApiError(401, 'Token is invalid or expired');
    }

    const user = await User.findById(decoded.id).populate('organization');
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'User account is deactivated');
    }

    if (!isValidRole(user.role)) {
      throw new ApiError(403, 'User role is not authorized');
    }

    if (!user.organization) {
      throw new ApiError(403, 'User does not belong to any organization');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Route-level role authorization.
 * Keep all role checks behind this middleware so Phase 0.6 can replace the
 * implementation with resource/action permissions without changing every
 * controller.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!hasAnyRole(req.user?.role, roles)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
