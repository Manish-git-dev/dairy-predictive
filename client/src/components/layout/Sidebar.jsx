import React from "react";
import { NavLink } from "react-router-dom";
import usePermissions from "../../hooks/usePermissions";
import useAuth from "../../hooks/useAuth";

const navGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: "dashboard", roles: ["ops_admin", "manager", "analyst", "field_staff"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Workflows", to: "/workflows", icon: "workflow", roles: ["ops_admin", "manager", "field_staff"] },
      { label: "Tasks", to: "/tasks", icon: "tasks", roles: ["ops_admin", "manager", "field_staff"] },
      { label: "Preventive Actions", to: "/preventive-actions", icon: "actions", roles: ["ops_admin", "manager"] },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Forecast", to: "/forecast", icon: "forecast", roles: ["ops_admin", "manager", "analyst"] },
      { label: "Predictions", to: "/predictions", icon: "prediction", roles: ["ops_admin", "manager", "analyst"] },
      { label: "Anomalies", to: "/anomalies", icon: "anomaly", roles: ["ops_admin", "manager", "analyst"] },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Reports", to: "/reports", icon: "reports", roles: ["ops_admin", "manager", "analyst"] },
      { label: "Notifications", to: "/notifications", icon: "notifications", roles: ["ops_admin", "manager", "analyst", "field_staff"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Administration", to: "/administration", icon: "users", roles: ["ops_admin"] },
      { label: "Settings", to: "/settings", icon: "settings", roles: ["ops_admin", "manager"] },
    ],
  },
];

function Icon({ name, className = "h-5 w-5" }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    workflow: <><path d="M6 4v16" /><path d="M6 7h8a4 4 0 0 1 0 8H9" /><path d="m12 12-3 3 3 3" /></>,
    tasks: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /><path d="m15 16 1.5 1.5L19 15" /></>,
    forecast: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-5 3 3 5-7" /></>,
    prediction: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
    anomaly: <><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v4M12 17h.01" /></>,
    actions: <><path d="M14.7 6.3a4.5 4.5 0 0 0-5.9 5.9L4 17l3 3 4.8-4.8a4.5 4.5 0 0 0 5.9-5.9L15 12l-3-3 2.7-2.7Z" /></>,
    reports: <><path d="M5 3h10l4 4v14H5V3Z" /><path d="M15 3v5h5M8 12h8M8 16h6" /></>,
    notifications: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M17 11a4 4 0 0 0 0-8M21 21v-2a4 4 0 0 0-3-3.9" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2.5v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.5h.4A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.5v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.6 1h.4v2.5H21a1.7 1.7 0 0 0-1.6 1.5Z" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function UserBlock({ collapsed, onCloseMobile }) {
  const { user, logout } = useAuth();
  const displayName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const role = user?.role || user?.roles?.[0] || "Operations user";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";

  const handleLogout = async () => {
    onCloseMobile?.();
    await logout();
  };

  return (
    <div className="border-t border-slate-800 p-3">
      <div className={`flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-2.5 ${collapsed ? "justify-center" : ""}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white">
          {initials}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{displayName}</p>
            <p className="mt-0.5 truncate text-[11px] capitalize text-slate-500">{String(role).replaceAll("_", " ")}</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-5" /></svg>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ collapsed = false, mobileOpen = false, onToggleCollapse, onCloseMobile }) {
  const { hasRole } = usePermissions();

  const content = (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`border-b border-slate-800/90 px-4 py-4 ${collapsed ? "xl:px-3" : ""}`}>
        <div className={`flex items-center gap-3 ${collapsed ? "xl:justify-center" : ""}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white shadow-ds-md">DO</div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-bold tracking-tight text-white">DairyOps</div>
              <div className="truncate text-xs text-slate-400">Predictive Operations</div>
            </div>
          )}
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Primary navigation">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => hasRole(item.roles));
          if (!visibleItems.length) return null;

          return (
            <div key={group.label} className="mb-5 last:mb-0">
              {!collapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{group.label}</p>}
              <div className="space-y-1">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${collapsed ? "xl:justify-center" : ""} ${
                        isActive
                          ? "bg-primary-600 text-white shadow-sm"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      }`
                    }
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-slate-300 transition group-hover:bg-white/10 group-hover:text-white group-[.bg-primary-600]:bg-white/10 group-[.bg-primary-600]:text-white">
                      <Icon name={item.icon} className="h-4 w-4" />
                    </span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="hidden border-t border-slate-800 p-3 xl:block">
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-900 hover:text-white ${collapsed ? "justify-center" : ""}`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
      </div>

      <UserBlock collapsed={collapsed} onCloseMobile={onCloseMobile} />
    </div>
  );

  return (
    <>
      <aside className={`hidden min-h-screen shrink-0 border-r border-slate-800 bg-slate-950 text-slate-100 transition-[width] duration-200 xl:flex xl:flex-col ${collapsed ? "w-[76px]" : "w-64"}`}>
        {content}
      </aside>

      <div className={`fixed inset-0 z-50 xl:hidden ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!mobileOpen}>
        <button
          type="button"
          className={`absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity duration-200 ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          onClick={onCloseMobile}
          aria-label="Close navigation"
        />
        <aside className={`absolute inset-y-0 left-0 flex w-[min(86vw,320px)] flex-col bg-slate-950 text-slate-100 shadow-2xl transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          {content}
        </aside>
      </div>
    </>
  );
}
