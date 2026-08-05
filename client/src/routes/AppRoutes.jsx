import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

// Pages
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import OperationsDashboardPage from "../pages/dashboard/OperationsDashboardPage";
import ForecastCapacityRiskPage from "../pages/analysis/ForecastCapacityRiskPage";
import AnomalyRiskPage from "../pages/anomalies/AnomalyRiskPage";
import PreventiveActionsPage from "../pages/preventive-actions/PreventiveActionsPage";
import PredictionsPage from "../pages/predictions/PredictionsPage";
import ReportsPage from "../pages/reports/ReportsPage";
import TaskScenarioPlanningPage from "../pages/tasks/TaskScenarioPlanningPage";
import WorkflowQueuesPage from "../pages/workflows/WorkflowQueuesPage";
import UserRoleManagementPage from "../pages/administration/UserRoleManagementPage";
import AuditSettingsPage from "../pages/settings/AuditSettingsPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import UnauthorizedPage from "../pages/errors/UnauthorizedPage";
import NotFoundPage from "../pages/errors/NotFoundPage";
import AppShell from "../components/layout/AppShell";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<OperationsDashboardPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/tasks" element={<TaskScenarioPlanningPage />} />
          <Route path="/workflows" element={<WorkflowQueuesPage />} />

          {/* Role-Restricted Routes */}
          <Route
            element={
              <RoleRoute allowedRoles={["ops_admin", "manager", "analyst"]} />
            }
          >
            <Route path="/forecast" element={<ForecastCapacityRiskPage />} />
            <Route path="/anomalies" element={<AnomalyRiskPage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          <Route
            element={<RoleRoute allowedRoles={["ops_admin", "manager"]} />}
          >
            <Route
              path="/preventive-actions"
              element={<PreventiveActionsPage />}
            />
            <Route path="/settings" element={<AuditSettingsPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={["ops_admin"]} />}>
            <Route
              path="/administration"
              element={<UserRoleManagementPage />}
            />
          </Route>
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
