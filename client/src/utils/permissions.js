export const ROLES = {
  OPS_ADMIN: 'ops_admin',
  MANAGER: 'manager',
  ANALYST: 'analyst',
  FIELD_STAFF: 'field_staff'
};

export const ROLE_LABELS = {
  [ROLES.OPS_ADMIN]: 'Operations Admin',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.ANALYST]: 'Analyst',
  [ROLES.FIELD_STAFF]: 'Field Staff'
};

export const hasRole = (user, allowedRoles) => {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
};

export const isOpsAdmin = (user) => {
  return user?.role === ROLES.OPS_ADMIN;
};

export const isManager = (user) => {
  return user?.role === ROLES.MANAGER;
};

export const isAnalyst = (user) => {
  return user?.role === ROLES.ANALYST;
};

export const isFieldStaff = (user) => {
  return user?.role === ROLES.FIELD_STAFF;
};
