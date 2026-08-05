import React from "react";
import useFetch from "../../hooks/useFetch";
import settingsService from "../../services/settingsService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function AuditSettingsPage() {
  const { data, loading, error } = useFetch(settingsService.getAllSettings);

  if (loading) return <LoadingSpinner label="Loading settings..." />;

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Logs & Settings</h1>
        <div className="text-sm text-slate-500">{items.length} settings</div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No settings available
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((it) => (
              <li
                key={it.key}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">{it.key}</div>
                  <div className="text-sm text-slate-500">
                    {JSON.stringify(it.value)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded border px-3 py-1">Edit</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
