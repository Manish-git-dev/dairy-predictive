import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const typeOptions = [
  ['all', 'All events'],
  ['alert', 'Alerts'],
  ['anomaly', 'Anomalies'],
  ['task', 'Tasks'],
  ['workflow', 'Workflows'],
  ['preventive_action', 'Preventive actions'],
  ['prediction', 'Predictions'],
  ['forecast', 'Forecasts'],
  ['approval', 'Approvals'],
];

const severityOptions = [
  ['all', 'All severity'],
  ['critical', 'Critical'],
  ['high', 'High'],
  ['medium', 'Medium'],
  ['low', 'Low'],
];

const entityPaths = {
  AnomalyEvent: '/anomalies',
  PreventiveRule: '/preventive-actions',
  Task: '/tasks',
  Workflow: '/workflows',
  Prediction: '/predictions',
  Forecast: '/forecasts',
  Alert: '/alerts',
  Approval: '/approvals',
};

const formatTimestamp = (value) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const severityClass = (severity) => ({
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
}[severity] || 'bg-slate-100 text-slate-600 border-slate-200');

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    error,
    unreadCount,
    setFilters,
    markAsRead,
    deleteNotification,
    markAllAsRead,
  } = useNotifications();
  const [readFilter, setReadFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const applyFilters = (next) => {
    const filters = {
      read: next.read === 'all' ? undefined : next.read,
      type: next.type === 'all' ? undefined : next.type,
      severity: next.severity === 'all' ? undefined : next.severity,
    };
    setFilters(filters);
  };

  const visibleNotifications = useMemo(() => notifications, [notifications]);

  const openRelated = async (notification) => {
    if (!notification.read) await markAsRead(notification._id);
    const path = entityPaths[notification.relatedEntity?.type];
    if (path) navigate(path);
  };

  if (loading && notifications.length === 0) return <LoadingSpinner label="Loading notifications..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">Live operational updates sync automatically without reloading the application.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">{unreadCount} unread</span>
          <button onClick={markAllAsRead} disabled={!unreadCount} className="rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50">
            Mark all read
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">
          Status
          <select value={readFilter} onChange={(e) => { setReadFilter(e.target.value); applyFilters({ read: e.target.value, type: typeFilter, severity: severityFilter }); }} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal">
            <option value="all">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Event type
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); applyFilters({ read: readFilter, type: e.target.value, severity: severityFilter }); }} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal">
            {typeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Severity
          <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); applyFilters({ read: readFilter, type: typeFilter, severity: e.target.value }); }} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal">
            {severityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {visibleNotifications.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No notifications match the current filters.</div>
        ) : (
          <ul className="space-y-3">
            {visibleNotifications.map((n) => (
              <li key={n._id} className={`rounded-xl border p-4 transition ${n.read ? 'bg-slate-50' : 'bg-white shadow-sm ring-1 ring-emerald-100'}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!n.read && <span className="h-2 w-2 rounded-full bg-emerald-500" aria-label="Unread" />}
                      <h2 className="font-semibold text-slate-900">{n.title}</h2>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${severityClass(n.severity)}`}>{n.severity || 'medium'}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{n.type}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{n.message}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>{formatTimestamp(n.createdAt)}</span>
                      {n.relatedEntity?.type && <span>Related: {n.relatedEntity.type}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {n.relatedEntity?.type && entityPaths[n.relatedEntity.type] && (
                      <button onClick={() => openRelated(n)} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
                        Open
                      </button>
                    )}
                    {!n.read && <button onClick={() => markAsRead(n._id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">Mark read</button>}
                    <button onClick={() => deleteNotification(n._id)} className="rounded-lg border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
