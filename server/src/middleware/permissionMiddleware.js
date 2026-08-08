const ApiError = require('../utils/ApiError');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

const METHOD_ACTIONS = Object.freeze({
  GET: 'read',
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete'
});

const RESOURCE_ALIASES = Object.freeze({
  'collection-centres': 'collection',
  'milk-lots': 'milk_lots',
  'quality-tests': 'testing',
  'sla-rules': 'sla_rules',
  'preventive-rules': 'preventive_rules',
  'risk': 'risk_scores',
  'kpi': 'kpi'
});

const normalizeResource = (resource) => RESOURCE_ALIASES[resource] || resource;

const inferResource = (req) => {
  const basePath = req.baseUrl || '';
  const segments = basePath.split('/').filter(Boolean);
  const resource = segments[segments.length - 1];

  if (!resource || resource === 'api' || resource === 'v1') {
    return null;
  }

  return normalizeResource(resource);
};

const inferAction = (req) => {
  const method = req.method.toUpperCase();
  const explicitAction = METHOD_ACTIONS[method];
  if (!explicitAction) return null;

  // State transitions/reviews are updates even when exposed as POST/PATCH.
  if (
    method === 'POST' &&
    /\/(transition|review|status|assign|escalate|read-all)(\/|$)/i.test(req.path || '')
  ) {
    return 'update';
  }

  return explicitAction;
};

const hasPermission = (role, resource, action) => {
  if (!role || !resource || !action) return false;

  return role.permissions.some((permission) => {
    if (!permission || permission.resource !== resource) return false;
    return Array.isArray(permission.actions) && permission.actions.includes(action);
  });
};

const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.organizationId) {
        return next(new ApiError(401, 'Authentication and organization context are required'));
      }

      const resolvedResource = resource || inferResource(req);
      const resolvedAction = action || inferAction(req);

      if (!resolvedResource || !resolvedAction) {
        return next(new ApiError(403, 'Permission could not be determined for this operation'));
      }

      const role = await Role.findOne({
        name: req.user.role,
        organization: req.organizationId
      }).select('name permissions isSystem');

      if (!role) {
        return next(new ApiError(403, 'No authorization role is configured for this organization'));
      }

      const roleAllowsAction = hasPermission(role, resolvedResource, resolvedAction);
      if (!roleAllowsAction) {
        return next(new ApiError(403, 'You do not have permission to perform this action'));
      }

      const permission = await Permission.findOne({
        resource: resolvedResource,
        action: resolvedAction,
        isActive: true
      }).select('_id');

      if (!permission) {
        return next(new ApiError(403, 'This permission is not active'));
      }

      req.permission = {
        resource: resolvedResource,
        action: resolvedAction
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

const authorizeByPermission = requirePermission();

module.exports = {
  requirePermission,
  authorizeByPermission,
  inferResource,
  inferAction
};
