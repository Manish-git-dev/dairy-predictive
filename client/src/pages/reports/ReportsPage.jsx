import React, { useEffect, useMemo, useState } from 'react';
import reportService from '../../services/reportService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const toInputDate = (date) => new Date(date).toISOString().slice(0, 10);
const initialEnd = new Date();
const initialStart = new Date();
initialStart.setDate(initialStart.getDate() - 6);

export default function ReportsPage() {
  const [types, setTypes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('daily_operations');
  const [startDate, setStartDate] = useState(toInputDate(initialStart));
  const [endDate, setEndDate] = useState(toInputDate(initialEnd));
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(null);

  const request = useMemo(() => ({
    type: selectedType,
    startDate: new Date(`${startDate}T00:00:00.000Z`).toISOString(),
    endDate: new Date(`${endDate}T23:59:59.999Z`).toISOString(),
    filters: {
      ...(status ? { status } : {}),
      ...(severity ? { severity } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
      page: 1,
      limit: 50
    }
  }), [selectedType, startDate, endDate, status, severity, search]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [typeResponse, historyResponse] = await Promise.all([
        reportService.getTypes(),
        reportService.getHistory({ page: 1, limit: 10 })
      ]);
      setTypes(typeResponse?.data || []);
      setHistory(historyResponse?.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const response = await reportService.generate(request);
      setPreview(response?.data || null);
      const historyResponse = await reportService.getHistory({ page: 1, limit: 10 });
      setHistory(historyResponse?.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Report generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const response = await reportService.downloadCsv(request);
      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${selectedType}-report-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      const historyResponse = await reportService.getHistory({ page: 1, limit: 10 });
      setHistory(historyResponse?.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Report download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading reports..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-slate-500">Generate operational reports without loading large datasets into the browser.</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{types.length} report types</div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium text-slate-700">Report type
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
              {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">Start date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">End date
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">Search
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ID, type, status..." className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">Status
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="">All statuses</option><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="detected">Detected</option><option value="resolved">Resolved</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">Severity
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="">All severities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={handleGenerate} disabled={generating || downloading} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">{generating ? 'Generating...' : 'Generate preview'}</button>
          <button onClick={handleDownload} disabled={generating || downloading} className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 disabled:opacity-50">{downloading ? 'Preparing CSV...' : 'Download CSV'}</button>
        </div>
      </section>

      {preview && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b p-5 md:flex-row md:items-center md:justify-between">
            <div><h2 className="font-semibold">Report preview</h2><p className="text-sm text-slate-500">{preview.metadata?.recordCount || 0} records • showing up to {preview.data?.length || 0}</p></div>
            <span className="text-xs text-slate-400">Server-side preview</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50"><tr>{preview.columns?.map((column) => <th key={column} className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">{column}</th>)}</tr></thead>
              <tbody>{(preview.data || []).map((row, index) => <tr key={index} className="border-t">{row.map((value, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-4 py-3 text-slate-700">{value == null ? '—' : String(value)}</td>)}</tr>)}</tbody>
            </table>
          </div>
          {!preview.data?.length && <div className="p-8 text-center text-slate-500">No records match these filters.</div>}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b p-5"><h2 className="font-semibold">Report history</h2><p className="text-sm text-slate-500">Recent generated reports and their metadata.</p></div>
        {history.length === 0 ? <div className="p-8 text-center text-slate-500">No reports generated yet.</div> : (
          <div className="divide-y">
            {history.map((run) => (
              <div key={run._id} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                <div><div className="font-medium">{run.metadata?.title || run.type}</div><div className="text-xs text-slate-500">{run.metadata?.startDate ? new Date(run.metadata.startDate).toLocaleDateString() : '—'} → {run.metadata?.endDate ? new Date(run.metadata.endDate).toLocaleDateString() : '—'} • {run.metadata?.recordCount || 0} records</div></div>
                <div className="flex items-center gap-3 text-xs"><span className="rounded-full bg-slate-100 px-2 py-1">{run.format}</span><span className={run.status === 'completed' ? 'text-emerald-600' : run.status === 'failed' ? 'text-red-600' : 'text-amber-600'}>{run.status}</span><span className="text-slate-400">{new Date(run.createdAt).toLocaleString()}</span></div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
