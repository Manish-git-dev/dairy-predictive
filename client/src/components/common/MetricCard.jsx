import React from "react";

export default function MetricCard({ title, value, delta, help }) {
  return (
    <div className="ds-card ds-card-interactive p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{value}</p>
        </div>
        {delta && (
          <span
            className={`ds-badge shrink-0 ${delta[0] === "+" ? "ds-badge-success" : "ds-badge-danger"}`}
          >
            {delta}
          </span>
        )}
      </div>
      {help && <p className="mt-3 text-xs leading-5 text-slate-500">{help}</p>}
    </div>
  );
}
