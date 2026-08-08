import React from "react";
import { NavLink } from "react-router-dom";
import usePermissions from "../../hooks/usePermissions";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: "⌂", roles: ["ops_admin", "manager", "analyst", "field_staff"] },
  { label: "Workflows", to: "/workflows", icon: "↻", roles: ["ops_admin", "manager", "field_staff"] },
  { label: "Tasks", to: "/tasks", icon: "✓", roles: ["ops_admin", "manager", "field_staff"] },
  { label: "Forecast", to: "/forecast", icon: "↗", roles: ["ops_admin", "manager", "analyst"] },
  { label: "Predictions", to: "/predictions", icon: "✦", roles: ["ops_admin", "manager", "analyst"] },
  { label: "Anomalies", to: "/anomalies", icon: "!", roles: ["ops_admin", "manager", "analyst"] },
  { label: "Preventive Actions", to: "/preventive-actions", icon: "↳", roles: ["ops_admin", "manager"] },
  { label: "Reports", to: "/reports", icon: "▤", roles: ["ops_admin", "manager", "analyst"] },
  { label: "Notifications", to: "/notifications", icon: "•", roles: ["ops_admin", "manager", "analyst", "field_staff"] },
  { label: "Administration", to: "/administration", icon: "◎", roles: ["ops_admin"] },
  { label: "Settings", to: "/settings", icon: "⚙", roles: ["ops_admin", "manager"] },
];

export default function Sidebar() {
  const { hasRole } = usePermissions();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950 text-slate-100 lg:flex lg:min-h-screen lg:flex-col xl:w-72">
      <div className="border-b border-slate-800/90 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white shadow-ds-md">
            DO
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight text-white">DairyOps</div>
            <div className="truncate text-xs text-slate-400">Predictive Operations</div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-2 pt-5">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Workspace</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Primary navigation">
        {navItems
          .filter((item) => hasRole(item.roles))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ${
                  isActive
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`
              }
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-xs font-semibold text-slate-300 transition group-hover:bg-white/10 group-hover:text-white">
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
      </nav>

      <div className="border-t border-slate-800/90 p-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-3">
          <p className="text-xs font-medium text-slate-300">Operations workspace</p>
          <p className="mt-1 text-[11px] leading-4 text-slate-500">Role-aware navigation for dairy operations teams.</p>
        </div>
      </div>
    </aside>
  );
}
