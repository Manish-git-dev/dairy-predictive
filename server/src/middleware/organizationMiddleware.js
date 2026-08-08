const ApiError = require('../utils/ApiError');
const Organization = require('../models/Organization');

const organizationMiddleware = async (req, res, next) => {
  try {
    if (!req.user || !req.user.organization) {
      return next(new ApiError(403, 'User does not belong to any organization'));
    }

    const organizationId = req.user.organization._id || req.user.organization;
    const organization = await Organization.findById(organizationId).select('_id isActive');

    if (!organization) {
      return next(new ApiError(403, 'Organization not found'));
    }

    if (!organization.isActive) {
      return next(new ApiError(403, 'Organization is inactive'));
    }

    req.organizationId = organization._id;
    req.organization = organization;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { setOrganization: organizationMiddleware };
