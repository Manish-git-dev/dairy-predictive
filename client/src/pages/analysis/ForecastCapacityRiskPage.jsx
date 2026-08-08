import React, { useMemo, useState } from "react";
import forecastService from "../../services/forecastService";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const METRICS = [
  { value: "milk_collection", label: "Milk collection", unit: "L" },
  { value: "demand", label: "Demand proxy (dispatched volume)", unit: "L" },
  { value: "operational_volume", label: "Operational volume", unit: "L" },
  { value: "capacity", label: "Capacity utilization", unit: "%" },
];

const HISTORY_OPTIONS = [7, 30, 90];
const HORIZON_OPTIONS = [7, 14, 30, 60, 90];

const formatValue = (value, unit) => {
  if (!Number.isFinite(Number(value))) return "—";
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit === "%" ? "%" : " L"}`;
};

const mergeSeries = (historical = [], forecast = []) => {
  const history = historical.map((item) => ({
    date: item.date,
    actual: Number.isFinite(Number(item.actual)) ? Number(item.actual) : null,
    predicted: null,
    lower: null,
    upper: null,
    confidence: null,
  }));

  const future = forecast.map((item) => ({
    date: item.date,
    actual: null,
    predicted: Number.isFinite(Number(item.predicted)) ? Number(item.predicted) : null,
    lower: Number.isFinite(Number(item.lower)) ? Number(item.lower) : null,
    upper: Number.isFinite(Number(item.upper)) ? Number(item.upper) : null,
    confidence: Number.isFinite(Number(item.confidence)) ? Number(item.confidence) : null,
  }));

  return [...history, ...future];
};

export default function ForecastCapacityRiskPage() {
  const [metric, setMetric] = useState("milk_collection");
  const [historyDays, setHistoryDays] = useState(30);
  const [horizon, setHorizon] = useState(7);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedMetric = METRICS.find((item) => item.value === metric) || METRICS[0];
  const chartData = useMemo(
    () => mergeSeries(forecast?.historical, forecast?.forecast),
    [forecast]
  );

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await forecastService.generate({
        metric,
        period: "daily",
        historyDays,
        horizon,
      });
      setForecast(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to generate forecast.");
    } finally {
      setLoading(false);
    }
  };

  const latest = forecast?.forecast?.[0];
  const averageActual = forecast?.historical?.length
    ? forecast.historical.reduce((sum, item) => sum + (Number(item.actual) || 0), 0) / forecast.historical.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Planning intelligence</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Forecast & Capacity Risk</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Database-backed baseline forecasting using real historical operational records. No synthetic or random values are generated.
          </p>
        </div>
        <button className="ds-btn ds-btn-primary" onClick={generate} disabled={loading} aria-busy={loading}>
          {loading ? "Generating…" : "Generate forecast"}
        </button>
      </div>

      <section className="ds-card p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="ds-label">
            Metric
            <select className="ds-input mt-2" value={metric} onChange={(event) => setMetric(event.target.value)} disabled={loading}>
              {METRICS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="ds-label">
            Historical range
            <select className="ds-input mt-2" value={historyDays} onChange={(event) => setHistoryDays(Number(event.target.value))} disabled={loading}>
              {HISTORY_OPTIONS.map((days) => <option key={days} value={days}>{days} days</option>)}
            </select>
          </label>
          <label className="ds-label">
            Forecast horizon
            <select className="ds-input mt-2" value={horizon} onChange={(event) => setHorizon(Number(event.target.value))} disabled={loading}>
              {HORIZON_OPTIONS.map((days) => <option key={days} value={days}>{days} days</option>)}
            </select>
          </label>
        </div>
      </section>

      {error && (
        <div className="ds-alert ds-alert-error" role="alert">
          <div>
            <p className="font-semibold">Forecast unavailable</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        </div>
      )}

      {!forecast && !loading && !error && (
        <div className="ds-card flex min-h-80 items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">↗</div>
            <h2 className="mt-4 text-lg font-semibold text-slate-950">Generate a real forecast</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Choose a metric, historical range and horizon. The server will calculate a baseline from your organization's MongoDB data.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="ds-card p-5">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-5 h-80 animate-pulse rounded-xl bg-slate-100" />
        </div>
      )}

      {forecast && !loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="ds-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next forecast</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{formatValue(latest?.predicted, selectedMetric.unit)}</p>
              <p className="mt-1 text-xs text-slate-500">{latest?.date || "—"}</p>
            </div>
            <div className="ds-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{latest?.confidence ? `${latest.confidence}%` : "—"}</p>
              <p className="mt-1 text-xs text-slate-500">First forecast point</p>
            </div>
            <div className="ds-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk</p>
              <p className="mt-2 text-2xl font-bold capitalize text-slate-950">{forecast.risk || "—"}</p>
              <p className="mt-1 text-xs text-slate-500">Based on forecast confidence</p>
            </div>
            <div className="ds-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Historical average</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{formatValue(averageActual, selectedMetric.unit)}</p>
              <p className="mt-1 text-xs text-slate-500">{forecast.historyDays} days</p>
            </div>
          </div>

          <section className="ds-card p-5">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Historical vs predicted</h2>
                <p className="mt-1 text-xs text-slate-500">{forecast.method} · generated {new Date(forecast.generatedAt).toLocaleString()}</p>
              </div>
              <span className="ds-badge ds-badge-info">{selectedMetric.label}</span>
            </div>
            <div className="mt-5 h-[390px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={28} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, name) => [formatValue(value, selectedMetric.unit), name]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="#bfdbfe" fillOpacity={0.35} name="Upper bound" connectNulls />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="#ffffff" fillOpacity={1} name="Lower bound" connectNulls />
                  <Line type="monotone" dataKey="actual" stroke="#0f172a" strokeWidth={2} dot={false} name="Historical" connectNulls={false} />
                  <Line type="monotone" dataKey="predicted" stroke="#2563eb" strokeWidth={2.5} dot={false} name="Forecast" connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="ds-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Forecast method</h2>
            <div className="mt-3 grid gap-4 text-sm text-slate-600 md:grid-cols-2">
              <p><strong className="text-slate-900">Method:</strong> 7-day weighted moving average. More recent observations receive greater weight.</p>
              <p><strong className="text-slate-900">Uncertainty:</strong> prediction bounds are derived from historical one-step residual variation and widen with forecast horizon.</p>
              <p><strong className="text-slate-900">Data:</strong> {forecast.historyDays} days of organization-scoped MongoDB records.</p>
              <p><strong className="text-slate-900">Demand note:</strong> demand is represented as a transparent proxy using dispatched batch volume because the current schema does not contain a direct customer-demand series.</p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
