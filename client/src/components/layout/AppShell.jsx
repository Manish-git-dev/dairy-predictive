import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <HeaderBar />
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
