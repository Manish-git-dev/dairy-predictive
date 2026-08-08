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

function MenuIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
}

function ChevronIcon() {
  return <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>;
}

function BellIcon() {
  return <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
}

function SearchIcon() {
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
}

export default function HeaderBar({ onOpenMobileNav }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const breadcrumb = crumbMap[location.pathname] || "Overview";
  const displayName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onOpenMobileNav} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-ds-sm transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none xl:hidden" aria-label="Open navigation">
            <MenuIcon />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="hidden sm:inline">DairyOps</span>
              <ChevronIcon />
              <span className="truncate font-medium text-slate-600">{breadcrumb}</span>
            </div>
            <h1 className="mt-0.5 truncate text-base font-semibold tracking-tight text-slate-950 sm:text-lg">{breadcrumb}</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden w-48 lg:block xl:w-56">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-400" aria-label="Global search placeholder">
              <SearchIcon />
              <span>Search workspace</span>
              <span className="ml-auto rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-400">⌘K</span>
            </div>
          </div>

          <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 sm:flex" title="Realtime connection active">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="text-[11px] font-semibold text-emerald-700">Live</span>
          </div>

          <Link to="/notifications" aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`} className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-ds-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
            <BellIcon />
            {unreadCount > 0 && <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-4 text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
          </Link>

          <div className="hidden h-7 w-px bg-slate-200 md:block" />

          <div className="hidden items-center gap-2 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-[11px] font-bold text-primary-700 ring-1 ring-primary-100">{initials}</div>
            <div className="hidden max-w-32 lg:block">
              <p className="truncate text-xs font-semibold text-slate-800">{displayName}</p>
              <p className="truncate text-[10px] text-slate-500">Operations user</p>
            </div>
            <button type="button" onClick={logout} className="ml-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none">Logout</button>
          </div>
        </div>
      </div>
    </header>
  );
}
