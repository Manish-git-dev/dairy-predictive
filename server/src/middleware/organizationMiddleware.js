const ApiError = require('../utils/ApiError');

const organizationMiddleware = (req, res, next) => {
  if (!req.user || !req.user.organization) {
    return next(new ApiError(403, 'User does not belong to any organization'));
  }
  
  req.organizationId = req.user.organization._id || req.user.organization;
  next();
};

module.exports = { setOrganization: organizationMiddleware };
