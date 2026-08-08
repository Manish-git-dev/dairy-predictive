import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import dashboardService from '../../services/dashboardService';
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
} from 'recharts';

const PERIODS = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

const QUALITY_COLORS = ['#10B981', '#F59E0B', '#EF4444'];
const GRADE_COLORS = ['#2563EB', '#6366F1', '#F59E0B', '#EF4444'];

const formatNumber = (value, digits = 0) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
};

const formatPercent = (value, digits = 1) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  return `${Number(value).toFixed(digits)}%`;
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getErrorMessage = (error) => {
  if (!error) return 'The dashboard service returned an error.';
  if (typeof error === 'string') return error;
  return error.message || error.userMessage || 'The dashboard service returned an error.';
};

function Skeleton({ className = 'h-10' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} aria-hidden="true" />;
}

function SectionError({ error, onRetry }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4" role="alert">
      <p className="text-sm font-semibold text-rose-800">Couldn’t load this section</p>
      <p className="mt-1 text-xs text-rose-700">{getErrorMessage(error)}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-xs font-semibold text-rose-800 underline underline-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function MetricCard({ title, value, subtitle, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
  };

  return (
    <article className="ds-card ds-card-interactive p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <span className={`h-3 w-3 shrink-0 rounded-full ${tones[tone] || tones.primary}`} aria-hidden="true" />
      </div>
    </article>
  );
}

function Section({ title, description, children, className = '' }) {
  return (
    <section className={`ds-card p-5 sm:p-6 ${className}`}>
      <div className="mb-5">
        <h2 className="text-base font-semibold tracking-tight text-slate-950">{title}</h2>
        {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function RiskItem({ label, value, detail, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0 last:pb-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
        {value}
      </span>
    </div>
  );
}

export default function OperationsDashboardPage() {
  const [period, setPeriod] = useState('30d');
  const [lastUpdated, setLastUpdated] = useState(null);
  const params = useMemo(() => ({ period }), [period]);

  const overview = useFetch(dashboardService.getOverview, params);
  const trend = useFetch(dashboardService.getCollectionTrend, params);
  const quality = useFetch(dashboardService.getQualityDistribution, params);
  const stages = useFetch(dashboardService.getStageMetrics);

  useEffect(() => {
    if (overview.data && !overview.loading) setLastUpdated(new Date());
  }, [overview.data, overview.loading]);

  const refresh = async () => {
    await Promise.allSettled([
      overview.refetch(params),
      trend.refetch(params),
      quality.refetch(params),
      stages.refetch(),
    ]);
    setLastUpdated(new Date());
  };

  const allInitialLoading = overview.loading && trend.loading && quality.loading && stages.loading;

  if (allInitialLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div><Skeleton className="h-7 w-64" /><Skeleton className="mt-2 h-4 w-80" /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Skeleton className="h-80 xl:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (overview.error && !overview.data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Operations Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Live operational performance and risk overview.</p>
        </div>
        <SectionError error={overview.error} onRetry={refresh} />
      </div>
    );
  }

  const data = overview.data || {};
  const risks = data.risks || {};
  const activity = Array.isArray(data.recentActivity) ? data.recentActivity : [];
  const trendData = Array.isArray(trend.data) ? trend.data : [];
  const qualityData = quality.data
    ? [
        { name: 'Accepted', value: Number(quality.data.accepted) || 0 },
        { name: 'Borderline', value: Number(quality.data.borderline) || 0 },
        { name: 'Rejected', value: Number(quality.data.rejected) || 0 },
      ].filter((item) => item.value > 0)
    : [];
  const gradeData = quality.data?.grades
    ? Object.entries(quality.data.grades)
        .map(([name, value]) => ({ name, value: Number(value) || 0 }))
        .filter((item) => item.value > 0)
    : [];
  const stageData = stages.data
    ? Object.entries(stages.data).map(([name, value]) => ({
        name: name === 'transport' ? 'dispatch' : name,
        value: Number(value) || 0,
      }))
    : [];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">Operations Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live data
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Your operational command center for collection, quality, workflow and risk.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-ds-sm" aria-label="Dashboard period">
            {PERIODS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPeriod(item.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${period === item.value ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                aria-pressed={period === item.value}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={overview.loading || trend.loading || quality.loading || stages.loading}
            className="ds-btn ds-btn-secondary h-9 px-3 text-xs"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500 shadow-ds-sm">
        <span>
          Period: {data.period ? `${formatDateTime(data.period.start)} – ${formatDateTime(data.period.end)}` : PERIODS.find((item) => item.value === period)?.label}
        </span>
        <span>Last updated: <strong className="font-semibold text-slate-700">{formatDateTime(lastUpdated)}</strong></span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Milk Collection" value={`${formatNumber(data.collectionVolume)} L`} subtitle={PERIODS.find((item) => item.value === period)?.label} />
        <MetricCard title="Average Fat" value={formatPercent(data.avgFat, 2)} subtitle="Recorded quality tests" tone="success" />
        <MetricCard title="Average SNF" value={formatPercent(data.avgSnf, 2)} subtitle="Recorded quality tests" />
        <MetricCard title="Rejection Rate" value={formatPercent(data.rejectionRate, 2)} subtitle="Rejected milk lots" tone={Number(data.rejectionRate) > 5 ? 'danger' : 'warning'} />
        <MetricCard title="Active Farmers" value={formatNumber(data.activeFarmers)} subtitle="Active organization members" />
        <MetricCard title="Active Collection Centers" value={formatNumber(data.activeCollectionCentres)} subtitle="Active centers" tone="success" />
        <MetricCard title="Pending Tasks" value={formatNumber(data.pendingTasks)} subtitle="Pending and active tasks" tone="warning" />
        <MetricCard title="Critical Alerts" value={formatNumber(data.criticalAlerts)} subtitle="Unresolved critical alerts" tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Section title="Collection trend" description="Milk collection volume by day." className="xl:col-span-2">
          {trend.error ? (
            <SectionError error={trend.error} onRetry={() => trend.refetch(params)} />
          ) : trend.loading ? (
            <Skeleton className="h-80" />
          ) : trendData.length ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={54} tickFormatter={(value) => `${formatNumber(value)}L`} />
                  <Tooltip formatter={(value) => [`${formatNumber(value)} L`, 'Collection']} labelFormatter={formatDate} />
                  <Line type="monotone" dataKey="volume" name="Collection" stroke="#2563EB" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No milk collection records are available for this period." />
          )}
        </Section>

        <Section title="Quality distribution" description="Quality test outcomes in the selected period.">
          {quality.error ? (
            <SectionError error={quality.error} onRetry={() => quality.refetch(params)} />
          ) : quality.loading ? (
            <Skeleton className="h-80" />
          ) : qualityData.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={qualityData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={62} outerRadius={94} paddingAngle={3} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {qualityData.map((entry, index) => <Cell key={entry.name} fill={QUALITY_COLORS[index % QUALITY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [formatNumber(value), name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No quality test records are available for this period." />
          )}
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Operational stages" description="Current records by operational stage.">
          {stages.error ? (
            <SectionError error={stages.error} onRetry={() => stages.refetch()} />
          ) : stages.loading ? (
            <Skeleton className="h-72" />
          ) : stageData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [formatNumber(value), 'Records']} />
                  <Bar dataKey="value" name="Records" fill="#2563EB" radius={[5, 5, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No operational stage records are available." />
          )}
        </Section>

        <Section title="Risk overview" description="Risks derived from current operational records and alerts.">
          <div>
            <RiskItem label="Anomalies" value={formatNumber(risks.anomalies)} detail="Detected or under investigation" tone={Number(risks.anomalies) ? 'warning' : 'success'} />
            <RiskItem label="Critical alerts" value={formatNumber(risks.criticalAlerts)} detail="Unacknowledged and unresolved" tone={Number(risks.criticalAlerts) ? 'danger' : 'success'} />
            <RiskItem label="Capacity risk" value={formatNumber(risks.capacityRisk)} detail="Active centers at 85%+ utilization" tone={Number(risks.capacityRisk) ? 'warning' : 'success'} />
            <RiskItem label="Quality risk" value={formatPercent(risks.qualityRisk?.rate, 1)} detail={`${formatNumber(risks.qualityRisk?.failed)} failed · ${formatNumber(risks.qualityRisk?.borderline)} borderline`} tone={Number(risks.qualityRisk?.rate) > 10 ? 'danger' : Number(risks.qualityRisk?.rate) ? 'warning' : 'success'} />
            <RiskItem label="Operational risk" value={formatNumber(risks.operationalRisk?.count)} detail={`${formatNumber(risks.operationalRisk?.escalatedTasks)} escalated tasks · ${formatNumber(risks.operationalRisk?.activeTankers)} active tankers`} tone={Number(risks.operationalRisk?.count) ? 'warning' : 'success'} />
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Recent activity" description="Latest operational events recorded in the selected period.">
          {activity.length ? (
            <div className="divide-y divide-slate-100">
              {activity.map((item) => (
                <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">{String(item.description || 'Operational event recorded')}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.stage ? `${String(item.stage)} · ` : ''}{String(item.user || 'System')} · {formatDateTime(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No operational activity has been recorded for this period." />
          )}
        </Section>

        <Section title="Quality grades" description="Grade breakdown from recorded quality tests.">
          {gradeData.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [formatNumber(value), 'Tests']} />
                  <Legend />
                  <Bar dataKey="value" name="Tests" fill="#6366F1" radius={[5, 5, 0, 0]} maxBarSize={48}>
                    {gradeData.map((entry, index) => <Cell key={entry.name} fill={GRADE_COLORS[index % GRADE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No quality grades are available for this period." />
          )}
        </Section>
      </div>

      <Section title="Quick actions" description="Jump directly into the operational workflows.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Create Task', description: 'Open task planning', to: '/tasks' },
            { label: 'View Anomalies', description: 'Review operational risks', to: '/anomalies' },
            { label: 'Create Workflow', description: 'Open workflow queues', to: '/workflows' },
            { label: 'Run Forecast', description: 'Open capacity forecast', to: '/forecast' },
            { label: 'View Reports', description: 'Open operational reports', to: '/reports' },
          ].map((action) => (
            <Link key={action.label} to={action.to} className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-ds-sm">
              <span className="block text-sm font-semibold text-slate-800">{action.label}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{action.description}</span>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
