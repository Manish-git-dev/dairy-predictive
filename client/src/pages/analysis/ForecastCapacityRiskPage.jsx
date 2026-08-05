import React from "react";
import useFetch from "../../hooks/useFetch";
import forecastService from "../../services/forecastService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function ForecastCapacityRiskPage() {
  const { data, loading, error } = useFetch(forecastService.getForecasts);

  if (loading) return <LoadingSpinner label="Loading forecasts..." />;

  const forecasts = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Forecast & Capacity Risk Analysis
        </h1>
        <div className="text-sm text-slate-500">
          {forecasts.length} forecast series
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Demand Forecast (selected)</h3>
        <div style={{ height: 360 }} className="mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecasts[0]?.series || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
