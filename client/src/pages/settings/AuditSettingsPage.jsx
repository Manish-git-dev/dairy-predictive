import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useFetch from '../../hooks/useFetch';
import settingsService from '../../services/settingsService';
import auditService from '../../services/auditService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CATEGORIES = ['general', 'quality', 'pricing', 'sla', 'notification', 'system'];
const ACTIONS = ['create', 'update', 'delete', 'activate', 'deactivate', 'change_password'];

const emptySetting = {
  key: '',
  value: '',
  category: 'general',
  description: '',
};

const prettyJson = (value) => {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

const labelize = (value = '') => value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AuditSettingsPage() {
  const [tab, setTab] = useState('settings');
  const [category, setCategory] = useState('');
  const [settingModal, setSettingModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [settingForm, setSettingForm] = useState(emptySetting);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [auditFilters, setAuditFilters] = useState({ page: 1, limit: 15, action: '', resource: '', actorSearch: '', startDate: '', endDate: '' });

  const fetchSettings = useCallback(() => settingsService.getAllSettings(), []);
  const { data: settingsData, loading: settingsLoading, error: settingsError, refetch: refetchSettings } = useFetch(fetchSettings);

  const fetchAudit = useCallback((params) => auditService.getAllLogs(params), []);
  const { data: auditData, loading: auditLoading, error: auditError, refetch: refetchAudit } = useFetch(fetchAudit, auditFilters, false);

  const allSettings = settingsData?.items || settingsData || [];
  const settings = useMemo(
    () => (category ? allSettings.filter((item) => item.category === category) : allSettings),
    [allSettings, category]
  );
  const auditItems = auditData?.items || [];
  const auditTotalPages = Math.max(auditData?.totalPages || 1, 1);

  useEffect(() => {
    if (tab === 'audit' && !auditData && !auditLoading) refetchAudit(auditFilters);
  }, [tab, auditData, auditLoading, refetchAudit, auditFilters]);

  const openCreate = () => {
    setEditingSetting(null);
    setSettingForm(emptySetting);
    setActionError('');
    setSettingModal(true);
  };

  const openEdit = (setting) => {
    setEditingSetting(setting);
    setSettingForm({
      key: setting.key || '',
      value: prettyJson(setting.value),
      category: setting.category || 'general',
      description: setting.description || '',
    });
    setActionError('');
    setSettingModal(true);
  };

  const saveSetting = async (event) => {
    event.preventDefault();
    setActionError('');
    if (!settingForm.key.trim()) {
      setActionError('Setting key is required.');
      return;
    }

    let parsedValue = settingForm.value;
    try {
      parsedValue = JSON.parse(settingForm.value);
    } catch {
      // Plain strings are valid Mixed values.
    }

    setSaving(true);
    try {
      await settingsService.setSetting(settingForm.key.trim(), {
        value: parsedValue,
        category: settingForm.category,
        description: settingForm.description.trim() || undefined,
      });
      setSettingModal(false);
      await refetchSettings();
      if (tab === 'audit') await refetchAudit(auditFilters);
    } catch (error) {
      setActionError(error?.userMessage || error?.response?.data?.error?.message || 'Unable to save setting.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSetting = async (setting) => {
    if (!window.confirm(`Delete setting “${setting.key}”? This action will be audited.`)) return;
    setActionError('');
    try {
      await settingsService.deleteSetting(setting.key);
      await refetchSettings();
      if (tab === 'audit') await refetchAudit(auditFilters);
    } catch (error) {
      setActionError(error?.userMessage || 'Unable to delete setting.');
    }
  };

  const updateAuditFilter = (key, value) => {
    setAuditFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const runAuditSearch = () => refetchAudit(auditFilters);

  if (settingsLoading && !settingsData) return <LoadingSpinner label="Loading settings..." />;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Administration</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Settings & audit</h1>
            <p className="mt-1 text-sm text-slate-500">Configure operational controls and review important administrative changes.</p>
          </div>
          {tab === 'settings' && (
            <button onClick={openCreate} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              + Add setting
            </button>
          )}
        </div>
        <div className="mt-6 flex gap-2 border-b border-slate-200">
          <button onClick={() => setTab('settings')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'settings' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Operational settings</button>
          <button onClick={() => setTab('audit')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'audit' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Audit log</button>
        </div>
      </section>

      {actionError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>}
      {settingsError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{settingsError.message}</div>}

      {tab === 'settings' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCategory('')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!category ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
            {CATEGORIES.map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${category === item ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{labelize(item)}</button>)}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {settings.map((setting) => (
              <article key={setting.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{labelize(setting.key)}</p><p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{labelize(setting.category || 'general')}</p></div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Configured</span>
                </div>
                <pre className="mt-4 max-h-32 overflow-auto rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-700">{prettyJson(setting.value)}</pre>
                {setting.description && <p className="mt-3 text-sm text-slate-500">{setting.description}</p>}
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                  <button onClick={() => openEdit(setting)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                  <button onClick={() => deleteSetting(setting)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50">Delete</button>
                </div>
              </article>
            ))}
          </div>
          {!settings.length && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><p className="font-semibold text-slate-800">No settings configured</p><p className="mt-1 text-sm text-slate-500">Add an operational threshold, SLA, notification, forecast, or prediction setting.</p></div>}
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 bg-slate-50/70 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <input value={auditFilters.actorSearch} onChange={(e) => updateAuditFilter('actorSearch', e.target.value)} placeholder="Search actor" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <input value={auditFilters.resource} onChange={(e) => updateAuditFilter('resource', e.target.value)} placeholder="Resource" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <select value={auditFilters.action} onChange={(e) => updateAuditFilter('action', e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
              <option value="">All actions</option>{ACTIONS.map((action) => <option key={action} value={action}>{labelize(action)}</option>)}
            </select>
            <input type="date" value={auditFilters.startDate} onChange={(e) => updateAuditFilter('startDate', e.target.value)} aria-label="Start date" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
            <input type="date" value={auditFilters.endDate} onChange={(e) => updateAuditFilter('endDate', e.target.value)} aria-label="End date" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
            <button onClick={runAuditSearch} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Search</button>
          </div>

          {auditError && <div role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{auditError.message}</div>}
          {auditLoading ? <div className="p-8"><LoadingSpinner label="Loading audit log..." /></div> : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[1050px] w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Timestamp</th><th className="px-5 py-3">Actor</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Resource</th><th className="px-5 py-3">Resource ID</th><th className="px-5 py-3">Changes</th><th className="px-5 py-3">Request</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditItems.map((item) => (
                      <tr key={item._id} className="align-top hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatDate(item.timestamp)}</td>
                        <td className="px-5 py-4"><div className="font-semibold text-slate-800">{item.user ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() : 'System'}</div><div className="text-xs text-slate-500">{item.user?.email || '—'}</div></td>
                        <td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{labelize(item.action)}</span></td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-700">{labelize(item.resource)}</td>
                        <td className="max-w-[180px] truncate px-5 py-4 font-mono text-xs text-slate-500">{item.resourceId || '—'}</td>
                        <td className="max-w-[280px] px-5 py-4"><details><summary className="cursor-pointer text-xs font-semibold text-blue-700">View changes</summary><pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 text-[11px]">{prettyJson(item.changes)}</pre></details></td>
                        <td className="px-5 py-4 text-xs text-slate-500"><div>{item.ipAddress || '—'}</div><div className="mt-1 max-w-[180px] truncate" title={item.userAgent}>{item.userAgent || '—'}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!auditItems.length && <div className="p-12 text-center"><p className="font-semibold text-slate-800">No audit events found</p><p className="mt-1 text-sm text-slate-500">Adjust the filters or perform an administrative action.</p></div>}
              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm"><span className="text-slate-500">{auditData?.total || 0} events</span><div className="flex items-center gap-2"><button disabled={auditFilters.page <= 1} onClick={() => { const next = { ...auditFilters, page: auditFilters.page - 1 }; setAuditFilters(next); refetchAudit(next); }} className="rounded-lg border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="px-2 font-medium text-slate-700">Page {auditFilters.page} of {auditTotalPages}</span><button disabled={auditFilters.page >= auditTotalPages} onClick={() => { const next = { ...auditFilters, page: auditFilters.page + 1 }; setAuditFilters(next); refetchAudit(next); }} className="rounded-lg border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>
            </>
          )}
        </section>
      )}

      {settingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-label={editingSetting ? 'Edit setting' : 'Add setting'}>
          <form onSubmit={saveSetting} className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-900">{editingSetting ? 'Edit setting' : 'Add setting'}</h2><p className="mt-1 text-sm text-slate-500">Changes are persisted to the organization configuration and audited.</p></div><button type="button" onClick={() => !saving && setSettingModal(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">✕</button></div>
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700">Setting key<input value={settingForm.key} disabled={Boolean(editingSetting)} onChange={(e) => setSettingForm({ ...settingForm, key: e.target.value })} placeholder="quality.rejection_rate_threshold" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" required /></label>
              <div className="grid gap-4 md:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Category<select value={settingForm.category} onChange={(e) => setSettingForm({ ...settingForm, category: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-blue-500">{CATEGORIES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label><label className="block text-sm font-medium text-slate-700">Description<input value={settingForm.description} onChange={(e) => setSettingForm({ ...settingForm, description: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500" /></label></div>
              <label className="block text-sm font-medium text-slate-700">Value <span className="font-normal text-slate-400">(JSON or plain text)</span><textarea value={settingForm.value} onChange={(e) => setSettingForm({ ...settingForm, value: e.target.value })} rows={7} placeholder={'0.05\n\nor\n{"enabled":true,"windowDays":7}'} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" required /></label>
            </div>
            {actionError && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div>}
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setSettingModal(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button><button disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save setting'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
