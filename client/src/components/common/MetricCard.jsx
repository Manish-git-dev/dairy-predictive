import React from "react";

export default function MetricCard({ title, value, delta, help }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        {delta && (
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${delta[0] === "+" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
          >
            {delta}
          </span>
        )}
      </div>
      {help && <p className="mt-4 text-sm text-slate-500">{help}</p>}
    </div>
  );
}
