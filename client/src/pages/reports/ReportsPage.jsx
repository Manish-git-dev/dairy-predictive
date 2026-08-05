import React, { useState } from "react";
import useFetch from "../../hooks/useFetch";
import reportService from "../../services/reportService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function ReportsPage() {
  const { data, loading, error } = useFetch(reportService.getTypes);
  const [generating, setGenerating] = useState(false);

  if (loading) return <LoadingSpinner label="Loading report types..." />;

  const types = data?.items || [];

  const handleGenerate = async (type) => {
    setGenerating(true);
    try {
      await reportService.generate({ type });
      alert("Report generation requested");
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <div className="text-sm text-slate-500">
          {types.length} report types
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {types.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No report types available
          </div>
        ) : (
          <ul className="space-y-3">
            {types.map((t) => (
              <li
                key={t.key}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.description}</div>
                </div>
                <div>
                  <button
                    onClick={() => handleGenerate(t.key)}
                    disabled={generating}
                    className="rounded bg-blue-600 px-3 py-1 text-white"
                  >
                    {generating ? "Generating..." : "Generate"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
