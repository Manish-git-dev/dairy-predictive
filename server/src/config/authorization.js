const { ROLES } = require('../utils/constants');

/**
 * Central role policy used by route-level authorization.
 *
 * Phase 0.5 keeps authorization role-based. Phase 0.6 will build the
 * resource/action permission layer on top of this single authorization
 * boundary.
 */
const AUTHORIZED_ROLES = Object.freeze(Object.values(ROLES));

const isValidRole = (role) => AUTHORIZED_ROLES.includes(role);

const hasAnyRole = (userRole, allowedRoles) => {
  if (!isValidRole(userRole) || !Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return false;
  }

  return allowedRoles.includes(userRole);
};

module.exports = {
  AUTHORIZED_ROLES,
  isValidRole,
  hasAnyRole
};
