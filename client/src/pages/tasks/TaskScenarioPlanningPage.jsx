import React from "react";
import useFetch from "../../hooks/useFetch";
import taskService from "../../services/taskService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function TaskScenarioPlanningPage() {
  const { data, loading, error, refetch } = useFetch(taskService.getMyTasks);

  if (loading) return <LoadingSpinner label="Loading tasks..." />;

  const tasks = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks & Scenario Planning</h1>
        <div className="text-sm text-slate-500">{tasks.length} tasks</div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No tasks assigned
          </div>
        ) : (
          <ul className="space-y-3">
            {tasks.map((t) => (
              <li
                key={t._id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-sm text-slate-500">
                    {t.status} • Assigned to:{" "}
                    {t.assignedTo?.name || "Unassigned"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded bg-blue-600 px-3 py-1 text-white">
                    Open
                  </button>
                  <button className="rounded border px-3 py-1">Assign</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
