import React, { useState } from "react";
import useFetch from "../../hooks/useFetch";
import anomalyService from "../../services/anomalyService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function AnomalyRiskPage() {
  const { data, loading, error, refetch } = useFetch(
    anomalyService.getAllAnomalies,
  );
  const [explaining, setExplaining] = useState(null);

  if (loading) return <LoadingSpinner label="Loading anomalies..." />;

  const anomalies = data?.items || [];

  const handleExplain = async (id) => {
    setExplaining(id);
    try {
      await anomalyService.explainAnomaly(id);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setExplaining(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Anomaly & Risk Detection</h1>
        <div className="text-sm text-slate-500">{anomalies.length} events</div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
        {anomalies.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No anomalies detected
          </div>
        ) : (
          <table className="w-full table-auto min-w-[720px]">
            <thead className="text-left text-sm text-slate-600">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((a) => (
                <tr key={a._id} className="border-t">
                  <td className="px-4 py-3">
                    {new Date(a.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{a.type}</td>
                  <td className="px-4 py-3">{a.severity}</td>
                  <td className="px-4 py-3">
                    {(a.confidence * 100)?.toFixed?.(0) ?? a.confidence}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExplain(a._id)}
                        className="rounded bg-blue-600 px-3 py-1 text-white"
                      >
                        {explaining === a._id ? "Explaining..." : "Explain"}
                      </button>
                      <button className="rounded border px-3 py-1">
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
