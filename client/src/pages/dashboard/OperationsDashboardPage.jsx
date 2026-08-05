import React from "react";
import useFetch from "../../hooks/useFetch";
import dashboardService from "../../services/dashboardService";
import MetricCard from "../../components/common/MetricCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6"];

export default function OperationsDashboardPage() {
  const {
    data: overview,
    loading,
    error,
    refetch,
  } = useFetch(dashboardService.getOverview);
  const { data: trendData } = useFetch(
    dashboardService.getCollectionTrend,
    {},
    false,
  );
  const { data: quality } = useFetch(
    dashboardService.getQualityDistribution,
    {},
    false,
  );

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          title="Collection Volume (L)"
          value={overview?.collectionVolume ?? "—"}
          delta={overview?.deltas?.collectionVolume}
        />
        <MetricCard
          title="Fat (%)"
          value={overview?.fatAvg ?? "—"}
          delta={overview?.deltas?.fat}
        />
        <MetricCard
          title="SNF (%)"
          value={overview?.snfAvg ?? "—"}
          delta={overview?.deltas?.snf}
        />
        <MetricCard
          title="Rejection Rate"
          value={overview?.rejectionRate ?? "—"}
          delta={overview?.deltas?.rejectionRate}
        />
        <MetricCard
          title="Chilling Time (hrs)"
          value={overview?.avgChillTime ?? "—"}
          delta={overview?.deltas?.chillTime}
        />
        <MetricCard
          title="Plant Yield (%)"
          value={overview?.plantYield ?? "—"}
          delta={overview?.deltas?.plantYield}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Collection Trend</h3>
            <button
              onClick={() => refetch()}
              className="text-sm text-slate-500 hover:underline"
            >
              Refresh
            </button>
          </div>
          <div style={{ height: 280 }} className="mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData?.items || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="fatAvg"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Quality Distribution</h3>
          <div style={{ height: 280 }} className="mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={quality?.items || []}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {(quality?.items || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
