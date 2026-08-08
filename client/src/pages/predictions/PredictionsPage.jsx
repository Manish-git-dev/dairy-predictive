import React, { useCallback, useEffect, useMemo, useState } from 'react';
import predictionService from '../../services/predictionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const labels = {
  quality_risk: 'Quality Risk',
  rejection_probability: 'Rejection Probability',
  spoilage_risk: 'Spoilage Risk',
  capacity_risk: 'Capacity Risk'
};

const riskClasses = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200'
};

const formatPercent = (value) => `${Math.round((Number(value) || 0) * 100)}%`;
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString();
};

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await predictionService.getPredictions({ limit: 100 });
      const items = response?.data?.items || [];
      setHistory(items);
      const latestByType = new Map();
      items.forEach((item) => {
        if (!latestByType.has(item.predictionType)) latestByType.set(item.predictionType, item);
      });
      setPredictions([...latestByType.values()]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load predictions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true);
    setError('');
    try {
      await predictionService.generate({ days: Number(days) });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to generate predictions.');
    } finally {
      setGenerating(false);
    }
  };

  const historyByType = useMemo(() => history.reduce((acc, item) => {
    (acc[item.predictionType] ||= []).push(item);
    return acc;
  }, {}), [history]);

  if (loading) return <LoadingSpinner label="Loading predictions..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Predictive analytics</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Operational Predictions</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Transparent statistical risk baselines calculated from your actual dairy operations data. No synthetic AI responses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={(e) => setDays(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button onClick={generate} disabled={generating} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {generating ? 'Generating...' : 'Generate predictions'}
          </button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {predictions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="font-semibold text-slate-900">No predictions available</h2>
          <p className="mt-1 text-sm text-slate-500">Generate a baseline using the operational data currently stored in MongoDB.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {predictions.map((item) => {
            const previous = historyByType[item.predictionType]?.[1];
            const trend = previous ? item.prediction - previous.prediction : 0;
            return (
              <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">{labels[item.predictionType] || item.predictionType}</h2>
                    <p className="mt-1 text-xs text-slate-500">{item.method}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${riskClasses[item.riskLevel] || riskClasses.low}`}>{item.riskLevel}</span>
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <div className="text-4xl font-bold text-slate-900">{formatPercent(item.prediction)}</div>
                    <div className="mt-1 text-xs text-slate-500">predicted probability</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold text-slate-700">{formatPercent(item.confidence)}</div>
                    <div className="text-xs text-slate-500">confidence</div>
                    <div className={`mt-2 text-xs font-medium ${trend > 0.01 ? 'text-red-600' : trend < -0.01 ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {trend > 0.01 ? '↑ Increasing' : trend < -0.01 ? '↓ Decreasing' : '→ Stable'}
                    </div>
                  </div>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.round(item.prediction * 100)}%` }} />
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Why this prediction?</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{item.explanation}</p>
                </div>

                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Recommended action</p>
                  <p className="mt-1 text-sm leading-6 text-blue-950">{item.recommendedAction}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Model: {item.modelVersion}</span>
                  <span>Period: {item.inputPeriod?.days || days} days</span>
                  <span>Generated: {formatDate(item.createdAt)}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Prediction history</h2>
              <p className="text-sm text-slate-500">Previous baseline runs stored in MongoDB.</p>
            </div>
            <span className="text-sm text-slate-500">{history.length} records</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">Type</th><th className="px-3 py-3">Prediction</th><th className="px-3 py-3">Risk</th><th className="px-3 py-3">Confidence</th><th className="px-3 py-3">Generated</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {history.slice(0, 20).map((item) => <tr key={item._id}><td className="px-3 py-3 font-medium">{labels[item.predictionType] || item.predictionType}</td><td className="px-3 py-3">{formatPercent(item.prediction)}</td><td className="px-3 py-3 capitalize">{item.riskLevel}</td><td className="px-3 py-3">{formatPercent(item.confidence)}</td><td className="px-3 py-3 text-slate-500">{formatDate(item.createdAt)}</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
