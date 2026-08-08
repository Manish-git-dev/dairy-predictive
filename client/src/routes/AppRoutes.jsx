import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import AppShell from "../components/layout/AppShell";

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const OperationsDashboardPage = lazy(() => import("../pages/dashboard/OperationsDashboardPage"));
const ForecastCapacityRiskPage = lazy(() => import("../pages/analysis/ForecastCapacityRiskPage"));
const AnomalyRiskPage = lazy(() => import("../pages/anomalies/AnomalyRiskPage"));
const PreventiveActionsPage = lazy(() => import("../pages/preventive-actions/PreventiveActionsPage"));
const PredictionsPage = lazy(() => import("../pages/predictions/PredictionsPage"));
const ReportsPage = lazy(() => import("../pages/reports/ReportsPage"));
const TaskScenarioPlanningPage = lazy(() => import("../pages/tasks/TaskScenarioPlanningPage"));
const WorkflowQueuesPage = lazy(() => import("../pages/workflows/WorkflowQueuesPage"));
const UserRoleManagementPage = lazy(() => import("../pages/administration/UserRoleManagementPage"));
const AuditSettingsPage = lazy(() => import("../pages/settings/AuditSettingsPage"));
const NotificationsPage = lazy(() => import("../pages/notifications/NotificationsPage"));
const UnauthorizedPage = lazy(() => import("../pages/errors/UnauthorizedPage"));
const NotFoundPage = lazy(() => import("../pages/errors/NotFoundPage"));

const RouteLoading = () => (
  <div className="flex min-h-[40vh] items-center justify-center p-6" role="status" aria-live="polite">
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" aria-hidden="true" />
      Loading page…
    </div>
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoading />}>
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
            <Route element={<RoleRoute allowedRoles={["ops_admin", "manager", "analyst"]} />}>
              <Route path="/forecast" element={<ForecastCapacityRiskPage />} />
              <Route path="/anomalies" element={<AnomalyRiskPage />} />
              <Route path="/predictions" element={<PredictionsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["ops_admin", "manager"]} />}>
              <Route path="/preventive-actions" element={<PreventiveActionsPage />} />
              <Route path="/settings" element={<AuditSettingsPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["ops_admin"]} />}>
              <Route path="/administration" element={<UserRoleManagementPage />} />
            </Route>
          </Route>
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
