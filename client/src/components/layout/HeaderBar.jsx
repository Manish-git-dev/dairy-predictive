import React from "react";
import { Link, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { useNotifications } from "../../context/NotificationContext";

const crumbMap = {
  "/dashboard": "Dashboard",
  "/workflows": "Workflows",
  "/tasks": "Tasks",
  "/forecast": "Forecast",
  "/predictions": "Predictions",
  "/anomalies": "Anomalies",
  "/preventive-actions": "Preventive Actions",
  "/reports": "Reports",
  "/notifications": "Notifications",
  "/administration": "Administration",
  "/settings": "Settings",
};

export default function HeaderBar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const breadcrumb = crumbMap[location.pathname] || "Overview";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-500">{breadcrumb}</div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Live data connected
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/notifications"
            className="relative inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            🔔
            <span className="ml-2">Notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[0.65rem] text-white">
                {unreadCount}
              </span>
            )}
          </Link>
          <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 md:flex">
            <span className="text-slate-500">{user?.name || "User"}</span>
            <button
              onClick={logout}
              className="rounded-full bg-slate-900 px-3 py-1 text-white transition hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
