const ApiError = require('../utils/ApiError');
const Role = require('../models/Role');

const METHOD_ACTIONS = Object.freeze({
  GET: 'read',
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete'
});

const RESOURCE_ALIASES = Object.freeze({
  'collection-centres': 'collection',
  'milk-lots': 'milkLots',
  'quality-tests': 'testing',
  'sla-rules': 'sla_rules',
  'preventive-rules': 'preventive_rules',
  risk: 'risk_scores',
  kpi: 'kpi'
});

const normalizeResource = (resource) => RESOURCE_ALIASES[resource] || resource;

const inferResource = (req) => {
  // This middleware runs on the parent /api/v1 router, so req.baseUrl alone
  // does not contain the child resource. Use the mounted URL first.
  const pathname = (req.originalUrl || req.baseUrl || '').split('?')[0];
  const segments = pathname.split('/').filter(Boolean);
  const versionIndex = segments.indexOf('v1');
  const resource = versionIndex >= 0 ? segments[versionIndex + 1] : segments[segments.length - 1];

  if (!resource || resource === 'api' || resource === 'v1') return null;
  return normalizeResource(resource);
};

const inferAction = (req) => {
  const method = req.method.toUpperCase();
  const explicitAction = METHOD_ACTIONS[method];
  if (!explicitAction) return null;

  // State transitions/reviews are updates even when exposed as POST.
  if (
    method === 'POST' &&
    /\/(transition|review|status|assign|escalate|read-all)(\/|$)/i.test(req.path || '')
  ) {
    return 'update';
  }

  return explicitAction;
};

const hasPermission = (role, resource, action) => {
  if (!role || !resource || !action || !Array.isArray(role.permissions)) return false;

  return role.permissions.some((permission) => {
    if (!permission || !Array.isArray(permission.actions)) return false;
    if (permission.resource !== resource && permission.resource !== '*') return false;
    return permission.actions.includes(action);
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

      // Role permissions are organization-scoped and are therefore the source
      // of truth for this phase. The Permission catalog remains available for
      // the more granular resource/action management introduced later.
      const role = await Role.findOne({
        name: req.user.role,
        organization: req.organizationId
      }).select('name permissions isSystem');

      if (!role) {
        return next(new ApiError(403, 'No authorization role is configured for this organization'));
      }

      if (!hasPermission(role, resolvedResource, resolvedAction)) {
        return next(new ApiError(403, 'You do not have permission to perform this action'));
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
