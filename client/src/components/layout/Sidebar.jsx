import React from "react";
import { NavLink } from "react-router-dom";
import usePermissions from "../../hooks/usePermissions";

const navItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: "🏠",
    roles: ["ops_admin", "manager", "analyst", "field_staff"],
  },
  {
    label: "Workflows",
    to: "/workflows",
    icon: "🔄",
    roles: ["ops_admin", "manager", "field_staff"],
  },
  {
    label: "Tasks",
    to: "/tasks",
    icon: "🧾",
    roles: ["ops_admin", "manager", "field_staff"],
  },
  {
    label: "Forecast",
    to: "/forecast",
    icon: "📈",
    roles: ["ops_admin", "manager", "analyst"],
  },
  {
    label: "Predictions",
    to: "/predictions",
    icon: "🤖",
    roles: ["ops_admin", "manager", "analyst"],
  },
  {
    label: "Anomalies",
    to: "/anomalies",
    icon: "⚠️",
    roles: ["ops_admin", "manager", "analyst"],
  },
  {
    label: "Preventive Actions",
    to: "/preventive-actions",
    icon: "🛠️",
    roles: ["ops_admin", "manager"],
  },
  {
    label: "Reports",
    to: "/reports",
    icon: "📊",
    roles: ["ops_admin", "manager", "analyst"],
  },
  {
    label: "Notifications",
    to: "/notifications",
    icon: "🔔",
    roles: ["ops_admin", "manager", "analyst", "field_staff"],
  },
  {
    label: "Administration",
    to: "/administration",
    icon: "👥",
    roles: ["ops_admin"],
  },
  {
    label: "Settings",
    to: "/settings",
    icon: "⚙️",
    roles: ["ops_admin", "manager"],
  },
];

export default function Sidebar() {
  const { hasRole } = usePermissions();

  return (
    <aside className="hidden lg:flex lg:w-72 xl:w-80 flex-col bg-slate-950 text-slate-100 shadow-lg">
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="text-sm uppercase tracking-[0.3em] text-slate-500">
          Dairy Command Center
        </div>
        <div className="mt-4 text-2xl font-bold">DairyOps</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => hasRole(item.roles))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-800 text-white shadow"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
      </nav>
      <div className="px-6 py-4 border-t border-slate-800 text-xs text-slate-500">
        Role-aware navigation tailored for operational teams.
      </div>
    </aside>
  );
}
