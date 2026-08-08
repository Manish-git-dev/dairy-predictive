import React, { useEffect, useMemo, useState } from 'react';
import anomalyService from '../../services/anomalyService';

const severityClasses = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const statusClasses = {
  detected: 'bg-blue-50 text-blue-700',
  investigating: 'bg-violet-50 text-violet-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  false_positive: 'bg-slate-100 text-slate-600'
};

const formatDate = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
};

const formatNumber = (value, digits = 2) => Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '—';

export default function AnomalyRiskPage() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [metric, setMetric] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await anomalyService.getAllAnomalies({ page, limit: 50, search: search || undefined, severity: severity || undefined, status: status || undefined, metric: metric || undefined });
      setData(result?.data || result || { items: [], total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load anomalies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, severity, status, metric]);

  const items = useMemo(() => data.items || [], [data.items]);

  const runDetection = async () => {
    setDetecting(true);
    setError('');
    try {
      await anomalyService.detectAnomalies({ days: 90 });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Anomaly detection failed.');
    } finally {
      setDetecting(false);
    }
  };

  const changeStatus = async (nextStatus) => {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await anomalyService.updateStatus(selected._id, nextStatus);
      const updated = result?.data || result;
      setSelected(updated);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to update anomaly status.');
    } finally {
      setSaving(false);
    }
  };

  const displayedItems = search
    ? items.filter((item) => `${item.metric || ''} ${item.type || ''} ${item.description || ''} ${item.entity?.label || ''}`.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Operational intelligence</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Anomaly Detection</h1>
          <p className="mt-1 text-sm text-slate-500">Transparent threshold, z-score and IQR checks over real operational data.</p>
        </div>
        <button onClick={runDetection} disabled={detecting} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
          {detecting ? 'Scanning operational data…' : 'Run detection'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Open anomalies', data.total || 0],
          ['Critical', items.filter((x) => x.severity === 'critical').length],
          ['Investigating', items.filter((x) => x.status === 'investigating').length],
          ['Resolved', items.filter((x) => x.status === 'resolved').length]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{Number.isFinite(Number(value)) ? value : 0}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search metric, entity or description…" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          <select value={metric} onChange={(e) => { setMetric(e.target.value); setPage(1); }} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
            <option value="">All metrics</option>
            <option value="milk_volume">Milk volume</option>
            <option value="fat">Fat</option>
            <option value="snf">SNF</option>
            <option value="temperature">Temperature</option>
            <option value="rejection_rate">Rejection rate</option>
            <option value="inventory">Inventory</option>
            <option value="payment">Payment</option>
          </select>
          <select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
            <option value="">All severities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
            <option value="">All statuses</option><option value="detected">Detected</option><option value="investigating">Investigating</option><option value="resolved">Resolved</option><option value="false_positive">False positive</option>
          </select>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-6">{[1, 2, 3, 4, 5].map((row) => <div key={row} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
        ) : displayedItems.length === 0 ? (
          <div className="p-12 text-center"><div className="text-sm font-semibold text-slate-900">No anomalies found</div><p className="mt-1 text-sm text-slate-500">Run detection against the latest operational data or adjust your filters.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Metric</th><th className="px-5 py-3">Actual</th><th className="px-5 py-3">Expected range</th><th className="px-5 py-3">Deviation</th><th className="px-5 py-3">Severity</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Detected</th><th className="px-5 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedItems.map((item) => (
                  <tr key={item._id} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-4"><div className="font-semibold text-slate-900">{item.metric || item.type || 'Unknown metric'}</div><div className="text-xs text-slate-500">{item.entity?.label || item.entity?.type || 'Aggregate'}</div></td>
                    <td className="px-5 py-4 font-medium text-slate-800">{formatNumber(item.actualValue ?? item.metrics?.actual)}</td>
                    <td className="px-5 py-4 text-slate-600">{item.expectedRange?.label || formatNumber(item.metrics?.expected)}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{formatNumber(item.metrics?.deviation, 0)}%</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${severityClasses[item.severity] || severityClasses.medium}`}>{item.severity || 'medium'}</span></td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[item.status] || statusClasses.detected}`}>{(item.status || 'detected').replace('_', ' ')}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-500">{formatDate(item.detectedAt)}</td>
                    <td className="px-5 py-4"><button onClick={() => setSelected(item)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data.totalPages > 1 && <div className="flex items-center justify-between text-sm text-slate-500"><span>Page {page} of {data.totalPages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Previous</button><button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Next</button></div></div>}

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><div className="text-xs font-semibold uppercase tracking-wide text-blue-600">Anomaly detail</div><h2 className="mt-1 text-xl font-bold text-slate-900">{selected.metric || selected.type}</h2></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close details">✕</button></div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Actual value</div><div className="mt-1 text-lg font-bold">{formatNumber(selected.actualValue ?? selected.metrics?.actual)}</div></div>
              <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Deviation</div><div className="mt-1 text-lg font-bold">{formatNumber(selected.metrics?.deviation, 0)}%</div></div>
            </div>
            <div className="mt-5 space-y-4 text-sm"><div><div className="font-semibold text-slate-900">Expected range</div><div className="mt-1 text-slate-600">{selected.expectedRange?.label || 'Not available'}</div></div><div><div className="font-semibold text-slate-900">Explanation</div><div className="mt-1 leading-6 text-slate-600">{selected.explanation || selected.description || 'No explanation available.'}</div></div><div><div className="font-semibold text-slate-900">Recommended action</div><div className="mt-1 rounded-xl border border-blue-100 bg-blue-50 p-4 leading-6 text-blue-900">{selected.recommendedAction || 'Investigate the affected operational entity.'}</div></div><div><div className="font-semibold text-slate-900">Detected</div><div className="mt-1 text-slate-600">{formatDate(selected.detectedAt)}</div></div></div>
            <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-200 pt-5">
              {selected.status === 'detected' && <button disabled={saving} onClick={() => changeStatus('investigating')} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Acknowledge</button>}
              {selected.status !== 'resolved' && selected.status !== 'false_positive' && <button disabled={saving} onClick={() => changeStatus('resolved')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Resolve</button>}
              {selected.status !== 'false_positive' && selected.status !== 'resolved' && <button disabled={saving} onClick={() => changeStatus('false_positive')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">False positive</button>}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
