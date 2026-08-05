import React from "react";

export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
      <div className="flex flex-col items-center gap-3 text-slate-600">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}
