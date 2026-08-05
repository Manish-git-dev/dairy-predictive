import React from "react";
import useFetch from "../../hooks/useFetch";
import workflowService from "../../services/workflowService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function WorkflowQueuesPage() {
  const { data, loading, error, refetch } = useFetch(
    workflowService.getAllQueues,
  );

  if (loading) return <LoadingSpinner label="Loading workflow queues..." />;

  const queues = data?.items || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workflow Queues</h1>
        <div className="text-sm text-slate-500">{queues.length} queues</div>
      </div>

      {queues.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
          No queues available
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
          <table className="w-full table-auto min-w-[720px]">
            <thead className="text-left text-sm text-slate-600">
              <tr>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Oldest</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queues.map((q) => (
                <tr key={q.stage} className="border-t">
                  <td className="px-4 py-3 font-medium">{q.stage}</td>
                  <td className="px-4 py-3">{q.count}</td>
                  <td className="px-4 py-3">{q.oldest || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="rounded bg-blue-600 px-3 py-1 text-white">
                        View
                      </button>
                      <button className="rounded border border-slate-200 px-3 py-1">
                        Reassign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
