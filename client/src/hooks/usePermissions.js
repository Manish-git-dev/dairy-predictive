import useAuth from './useAuth';
import { ROLES, hasRole, isOpsAdmin, isManager, isAnalyst, isFieldStaff } from '../utils/permissions';

export const usePermissions = () => {
  const { user } = useAuth();

  return {
    role: user?.role || null,
    isOpsAdmin: isOpsAdmin(user),
    isManager: isManager(user),
    isAnalyst: isAnalyst(user),
    isFieldStaff: isFieldStaff(user),
    hasRole: (allowedRoles) => hasRole(user, allowedRoles),
    canAccessAdmin: isOpsAdmin(user),
    canAccessSettings: isOpsAdmin(user) || isManager(user),
    canTransitionWorkflows: isOpsAdmin(user) || isManager(user) || isFieldStaff(user),
    canManageTasks: isOpsAdmin(user) || isManager(user),
    canGenerateForecasts: isOpsAdmin(user) || isManager(user) || isAnalyst(user),
    canDetectAnomalies: isOpsAdmin(user) || isManager(user) || isAnalyst(user),
  };
};

export default usePermissions;
