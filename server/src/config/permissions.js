const { ROLES } = require('../utils/constants');

const rolePermissions = {
  [ROLES.OPS_ADMIN]: {
    '*': ['create', 'read', 'update', 'delete']
  },
  [ROLES.MANAGER]: {
    'operations': ['create', 'read', 'update', 'delete'],
    'reports': ['create', 'read', 'update', 'delete'],
    'tasks': ['create', 'read', 'update', 'delete'],
    'approvals': ['create', 'read', 'update', 'delete'],
    'users': ['read']
  },
  [ROLES.ANALYST]: {
    '*': ['read'],
    'reports': ['create', 'read', 'update'],
    'forecasts': ['create', 'read', 'update'],
    'anomalies': ['create', 'read', 'update']
  },
  [ROLES.FIELD_STAFF]: {
    'tasks': ['read', 'update'],
    'collection': ['read'],
    'testing': ['read']
  }
};

const checkPermission = (role, resource, action) => {
  if (!role || !resource || !action) return false;
  
  const permissions = rolePermissions[role];
  if (!permissions) return false;
  
  if (permissions['*'] && permissions['*'].includes(action)) {
    return true;
  }
  
  const resourcePermissions = permissions[resource];
  if (resourcePermissions && resourcePermissions.includes(action)) {
    return true;
  }
  
  return false;
};

module.exports = {
  checkPermission
};
