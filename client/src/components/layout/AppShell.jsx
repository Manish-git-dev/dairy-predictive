import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";

export default function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <div className="flex min-h-screen">
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

          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
