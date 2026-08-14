import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowLeft, ArrowUpDown, CheckCircle2, Filter, RefreshCw, Search, XCircle } from 'lucide-react';
import Button from '../shared/components/Button';
import EmptyState from '../shared/components/EmptyState';
import ErrorMessage from '../shared/components/ErrorMessage';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import { fetchSystemHealth, type HealthSnapshotEntry, type HealthStatus } from '../features/admin/services/systemHealth';

type Props = { onBack: () => void };
type StatusFilter = 'all' | HealthStatus;
type SortKey = 'status' | 'feature' | 'checked';

const statusConfig: Record<HealthStatus, { label: string; Icon: typeof CheckCircle2; iconClass: string; badgeClass: string; borderClass: string; dotClass: string; rank: number }> = {
  green: { label: 'Healthy', Icon: CheckCircle2, iconClass: 'text-emerald-600', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', borderClass: 'border-l-emerald-500', dotClass: 'bg-emerald-500', rank: 2 },
  orange: { label: 'Warning', Icon: AlertTriangle, iconClass: 'text-amber-600', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', borderClass: 'border-l-amber-500', dotClass: 'bg-amber-500', rank: 1 },
  red: { label: 'Critical', Icon: XCircle, iconClass: 'text-red-600', badgeClass: 'bg-red-50 text-red-700 border-red-200', borderClass: 'border-l-red-500', dotClass: 'bg-red-500', rank: 0 },
};

const formatCheckedTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value || '—' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const formatRefreshedAt = (value: number) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(value));

export default function AdminSystemHealthPage({ onBack }: Props) {
  const [entries, setEntries] = useState<HealthSnapshotEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('status');

  const load = useCallback(async (manual = true) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await fetchSystemHealth();
      setEntries(result);
      setRefreshedAt(Date.now());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load system health snapshot.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(false); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = window.setInterval(() => { void load(true); }, 30_000);
    return () => window.clearInterval(interval);
  }, [autoRefresh, load]);

  const summary = useMemo(() => entries.reduce((acc, entry) => { acc[entry.status] += 1; return acc; }, { green: 0, orange: 0, red: 0 } as Record<HealthStatus, number>), [entries]);
  const visibleEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries
      .filter(entry => statusFilter === 'all' || entry.status === statusFilter)
      .filter(entry => !normalized || entry.feature.toLowerCase().includes(normalized) || entry.message.toLowerCase().includes(normalized))
      .sort((a, b) => {
        if (sortKey === 'feature') return a.feature.localeCompare(b.feature);
        if (sortKey === 'checked') return new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime();
        return statusConfig[a.status].rank - statusConfig[b.status].rank || a.feature.localeCompare(b.feature);
      });
  }, [entries, query, sortKey, statusFilter]);

  const overall = summary.red > 0 ? { label: 'Critical issues', className: 'border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500' } : summary.orange > 0 ? { label: 'Degraded', className: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500' } : { label: 'Operational', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 font-medium text-pink-600 hover:text-pink-700"><ArrowLeft className="h-4 w-4" /> Admin</button><span>/</span><span>System Health</span></nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold text-slate-900">System Health</h1><p className="mt-1 text-sm text-slate-500">Monitor the current health of the BEAT platform.</p></div><div className="flex flex-wrap items-center gap-3"><label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600"><input type="checkbox" checked={autoRefresh} onChange={event => setAutoRefresh(event.target.checked)} className="peer sr-only" /><span className="relative h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-pink-600 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" /><span>Auto refresh</span></label><Button variant="secondary" onClick={() => void load(true)} disabled={loading || refreshing}><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh</Button></div></div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-2xl border p-4 ${overall.className}`}><p className="text-xs font-semibold uppercase tracking-wide opacity-70">Current state</p><div className="mt-2 flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${overall.dot}`} /><p className="text-lg font-bold">{overall.label}</p></div><p className="mt-1 text-xs opacity-70">Live snapshot; uptime history is not provided.</p></div>
        <SummaryCard label="Healthy" value={summary.green} tone="emerald" onClick={() => setStatusFilter(current => current === 'green' ? 'all' : 'green')} active={statusFilter === 'green'} />
        <SummaryCard label="Warning" value={summary.orange} tone="amber" onClick={() => setStatusFilter(current => current === 'orange' ? 'all' : 'orange')} active={statusFilter === 'orange'} />
        <SummaryCard label="Critical" value={summary.red} tone="red" onClick={() => setStatusFilter(current => current === 'red' ? 'all' : 'red')} active={statusFilter === 'red'} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative min-w-0 flex-1 lg:max-w-lg"><span className="sr-only">Filter health features</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter features or messages" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" /></label>
        <div className="flex flex-col gap-3 sm:flex-row"><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600"><Filter className="h-4 w-4" /><span className="sr-only">Status filter</span><select value={statusFilter} onChange={event => setStatusFilter(event.target.value as StatusFilter)} className="min-h-11 bg-transparent outline-none"><option value="all">All statuses</option><option value="green">Healthy</option><option value="orange">Warning</option><option value="red">Critical</option></select></label><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600"><ArrowUpDown className="h-4 w-4" /><span className="sr-only">Sort health features</span><select value={sortKey} onChange={event => setSortKey(event.target.value as SortKey)} className="min-h-11 bg-transparent outline-none"><option value="status">Severity first</option><option value="feature">Feature name</option><option value="checked">Recently checked</option></select></label></div>
      </div>

      {refreshedAt && <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><p>Last refreshed {formatRefreshedAt(refreshedAt)}</p>{autoRefresh && <p>Refreshing every 30 seconds</p>}</div>}

      {loading ? <LoadingSpinner size="lg" className="min-h-48" /> : error ? <div className="space-y-4"><ErrorMessage message={error} /><Button variant="secondary" onClick={() => void load(true)}><RefreshCw className="h-4 w-4" /> Try again</Button></div> : entries.length === 0 ? <EmptyState title="No health data available" description="The health snapshot returned no features to display." icon={<Activity className="h-7 w-7" />} action={<Button variant="secondary" onClick={() => void load(true)}><RefreshCw className="h-4 w-4" /> Refresh</Button>} /> : visibleEntries.length === 0 ? <EmptyState title="No matching health features" description="Clear the search or choose another status." icon={<Search className="h-7 w-7" />} action={<Button variant="secondary" onClick={() => { setQuery(''); setStatusFilter('all'); }}>Clear filters</Button>} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleEntries.map(entry => { const config = statusConfig[entry.status] ?? statusConfig.red; const { Icon } = config; return <article key={entry.feature} className={`rounded-2xl border border-l-4 border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md ${config.borderClass}`}><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><Icon className={`h-5 w-5 ${config.iconClass}`} /><h3 className="text-base font-semibold text-slate-900">{entry.feature}</h3></div><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.badgeClass}`}><span className={`h-2 w-2 rounded-full ${config.dotClass}`} />{config.label}</span></div><p className="mt-3 text-sm leading-relaxed text-slate-600">{entry.message}</p><p className="mt-4 text-xs text-slate-400">Checked {formatCheckedTime(entry.checked_at)}</p></article>; })}</div>}
    </div>
  );
}

function SummaryCard({ label, value, tone, onClick, active }: { label: string; value: number; tone: 'emerald' | 'amber' | 'red'; onClick: () => void; active: boolean }) {
  const tones = { emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700', amber: 'border-amber-200 bg-amber-50 text-amber-700', red: 'border-red-200 bg-red-50 text-red-700' };
  const dots = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' };
  return <button type="button" onClick={onClick} aria-pressed={active} className={`rounded-2xl border p-4 text-left transition ${tones[tone]} ${active ? 'ring-2 ring-pink-300 ring-offset-2' : ''}`}><p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p><div className="mt-2 flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${dots[tone]}`} /><p className="text-2xl font-bold">{value}</p></div></button>;
}
