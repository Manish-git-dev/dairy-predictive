import React from "react";
import useFetch from "../../hooks/useFetch";
import aiService from "../../services/aiService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function PredictionsPage() {
  const { data, loading, error } = useFetch(aiService.getRuns);

  if (loading) return <LoadingSpinner label="Loading AI runs..." />;

  const runs = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Predictive Modelling</h1>
        <div className="text-sm text-slate-500">{runs.length} runs</div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {runs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No model runs available
          </div>
        ) : (
          <ul className="space-y-3">
            {runs.map((r) => (
              <li
                key={r._id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">
                    Model {r.modelName} • v{r.version}
                  </div>
                  <div className="text-sm text-slate-500">
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded bg-blue-600 px-3 py-1 text-white">
                    View
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
