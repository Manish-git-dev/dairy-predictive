import React from "react";

export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-slate-200 bg-white p-10 shadow-ds-sm" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-slate-600">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-primary-600" aria-hidden="true" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}
