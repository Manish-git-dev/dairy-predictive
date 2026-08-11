import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";

export default function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const isPublicRoute = ["/login", "/forgot-password", "/unauthorized"].includes(location.pathname);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  if (isPublicRoute) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 antialiased">
      <div className="flex min-h-screen min-w-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileNavOpen}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <HeaderBar
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />

          <main className="min-w-0 flex-1 overflow-x-auto overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px] min-w-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
