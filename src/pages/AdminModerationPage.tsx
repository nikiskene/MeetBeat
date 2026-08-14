import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  ExternalLink,
  FileWarning,
  Filter,
  FolderOpen,
  Loader2,
  MessageSquare,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import {
  fetchModerationSnapshot,
  moderationCapabilities,
  type ModerationCase,
  type ModerationEvent,
  type ModerationSnapshot,
} from '../features/admin/services/adminModeration';

type Props = {
  onBack: () => void;
  onOpenConversation: (userId: string) => void;
};

type View = 'all' | 'reports' | 'cases' | 'blocks' | 'events';

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const label = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (character: string) => character.toUpperCase());

const priorityClass: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  normal: 'bg-sky-100 text-sky-700',
  low: 'bg-slate-100 text-slate-600',
};

function uniqueEvents(events: ModerationEvent[], eventType: string) {
  const seen = new Set<string>();
  return events.filter(event => {
    if (event.eventType !== eventType) return false;
    const key = event.subjectId ?? event.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function AdminModerationPage({ onBack, onOpenConversation }: Props) {
  const [snapshot, setSnapshot] = useState<ModerationSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<View>('all');
  const [priority, setPriority] = useState('all');
  const [selectedCase, setSelectedCase] = useState<ModerationCase | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchModerationSnapshot()
      .then(result => {
        if (active) setSnapshot(result);
      })
      .catch(reason => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load moderation data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reload]);

  const reports = useMemo(() => uniqueEvents(snapshot?.events ?? [], 'report.created'), [snapshot]);
  const blocks = useMemo(() => uniqueEvents(snapshot?.events ?? [], 'block.created'), [snapshot]);
  const normalizedSearch = search.toLowerCase();
  const matchesSearch = (...values: Array<string | null | undefined>) =>
    !normalizedSearch || values.some(value => value?.toLowerCase().includes(normalizedSearch));

  const cases = (snapshot?.cases ?? []).filter(item =>
    (priority === 'all' || item.priority === priority) &&
    matchesSearch(item.title, item.description, item.type, item.status, String(item.caseNumber))
  );
  const filteredReports = reports.filter(item => matchesSearch(item.summary, item.eventType, item.subjectId));
  const filteredBlocks = blocks.filter(item => matchesSearch(item.summary, item.eventType, item.subjectId));
  const events = (snapshot?.events ?? []).filter(item => matchesSearch(item.summary, item.eventType, item.category, item.severity));

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch(query.trim());
  };

  const openMember = (memberId: string | null) => {
    if (memberId) setSelectedMemberId(memberId);
  };

  const selectedMember = selectedMemberId ? snapshot?.members[selectedMemberId] : null;
  const show = (section: View) => view === 'all' || view === section;

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 font-medium text-pink-600 hover:text-pink-700">
          <ArrowLeft className="h-4 w-4" /> Admin
        </button>
        <span>/</span><span>Moderation</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Moderation Center</h1>
        <p className="mt-1 text-sm text-slate-500">Review trust and safety activity, cases and member signals.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { key: 'reports' as View, title: 'Open reports', value: reports.length, Icon: FileWarning, tone: 'text-orange-600 bg-orange-50' },
          { key: 'cases' as View, title: 'Open cases', value: snapshot?.cases.length ?? 0, Icon: FolderOpen, tone: 'text-pink-600 bg-pink-50' },
          { key: 'blocks' as View, title: 'Blocks', value: blocks.length, Icon: Ban, tone: 'text-red-600 bg-red-50' },
          { key: 'events' as View, title: 'Recent events', value: snapshot?.events.length ?? 0, Icon: ShieldCheck, tone: 'text-emerald-600 bg-emerald-50' },
        ].map(item => (
          <button key={item.key} type="button" onClick={() => setView(current => current === item.key ? 'all' : item.key)} className={`rounded-2xl border p-5 text-left shadow-sm transition ${view === item.key ? 'border-pink-300 bg-pink-50/40' : 'border-slate-200 bg-white hover:border-pink-200'}`}>
            <span className={`inline-flex rounded-xl p-2.5 ${item.tone}`}><item.Icon className="h-5 w-5" /></span>
            <p className="mt-4 text-2xl font-bold text-slate-900">{loading ? '—' : item.value}</p>
            <p className="text-sm text-slate-500">{item.title}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <form onSubmit={submitSearch} className="flex min-w-0 flex-1 gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search moderation records</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search cases, events or IDs" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
          </label>
          <button type="submit" className="rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white hover:bg-pink-700">Search</button>
        </form>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600">
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filter case priority</span>
          <select value={priority} onChange={event => setPriority(event.target.value)} className="min-h-11 bg-transparent pr-6 outline-none">
            <option value="all">All priorities</option>
            {['critical', 'urgent', 'high', 'normal', 'low'].map(value => <option key={value} value={value}>{label(value)}</option>)}
          </select>
        </label>
      </div>

      {snapshot?.unavailableReason && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div><p className="font-semibold">Moderation backend access required</p><p className="mt-1 text-amber-700">{snapshot.unavailableReason}</p></div>
        </div>
      )}

      {selectedMemberId && (
        <aside className="rounded-2xl border border-pink-100 bg-pink-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {selectedMember?.avatarUrl ? <img src={selectedMember.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white"><UserRound className="h-5 w-5 text-slate-400" /></span>}
              <div><p className="font-semibold text-slate-900">{selectedMember?.displayName ?? 'Member profile'}</p><p className="text-xs text-slate-500">{selectedMember?.country ?? selectedMemberId}</p></div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => onOpenConversation(selectedMemberId)} className="inline-flex items-center gap-2 text-sm font-semibold text-pink-600"><MessageSquare className="h-4 w-4" /> Open conversation</button>
              <button type="button" onClick={() => setSelectedMemberId(null)} className="text-sm font-medium text-slate-500">Close</button>
            </div>
          </div>
        </aside>
      )}

      {loading ? (
        <div className="flex min-h-52 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading moderation data…</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-red-500" /><p className="mt-3 font-semibold text-red-700">Unable to load moderation data</p><p className="mt-1 text-sm text-red-600">{error}</p><button type="button" onClick={() => setReload(value => value + 1)} className="mt-4 text-sm font-semibold text-pink-600">Try again</button></div>
      ) : (
        <div className="space-y-6">
          {show('reports') && <EventSection title="Open reports" empty="No report events found." events={filteredReports} snapshot={snapshot} onOpenCase={caseId => setSelectedCase(snapshot?.cases.find(item => item.id === caseId) ?? null)} onOpenMember={openMember} markReviewed={moderationCapabilities.markReviewed} />}
          {show('cases') && <CaseSection cases={cases} onOpenCase={setSelectedCase} onOpenMember={openMember} onOpenConversation={onOpenConversation} />}
          {show('blocks') && <EventSection title="Blocks" empty="No block events found." events={filteredBlocks} snapshot={snapshot} onOpenCase={caseId => setSelectedCase(snapshot?.cases.find(item => item.id === caseId) ?? null)} onOpenMember={openMember} markReviewed={false} />}
          {show('events') && <EventSection title="Recent moderation events" empty="No moderation events found." events={events} snapshot={snapshot} onOpenCase={caseId => setSelectedCase(snapshot?.cases.find(item => item.id === caseId) ?? null)} onOpenMember={openMember} markReviewed={false} />}
        </div>
      )}

      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Case ${selectedCase.caseNumber}`}>
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:max-w-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-pink-600">Case #{selectedCase.caseNumber}</p><h2 className="mt-1 text-xl font-bold text-slate-900">{selectedCase.title}</h2></div><button type="button" onClick={() => setSelectedCase(null)} className="text-sm font-medium text-slate-500">Close</button></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><Info label="Status" value={label(selectedCase.status)} /><Info label="Priority" value={label(selectedCase.priority)} /><Info label="Type" value={label(selectedCase.type)} /></div>
            <p className="mt-5 text-sm leading-6 text-slate-600">{selectedCase.description || 'No case description was provided.'}</p>
            <p className="mt-4 text-xs text-slate-400">Opened {formatDateTime(selectedCase.createdAt)}</p>
            {selectedCase.primaryMemberId && <button type="button" onClick={() => { openMember(selectedCase.primaryMemberId); setSelectedCase(null); }} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-pink-600"><UserRound className="h-4 w-4" /> Open user</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label: title, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">{title}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value}</p></div>;
}

function CaseSection({ cases, onOpenCase, onOpenMember, onOpenConversation }: { cases: ModerationCase[]; onOpenCase: (item: ModerationCase) => void; onOpenMember: (id: string | null) => void; onOpenConversation: (id: string) => void }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Open cases</h2></header>{cases.length === 0 ? <Empty text="No open cases match these filters." /> : <div className="divide-y divide-slate-100">{cases.map(item => <article key={item.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-pink-600">#{item.caseNumber}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClass[item.priority] ?? priorityClass.low}`}>{label(item.priority)}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{label(item.status)}</span></div><h3 className="mt-2 font-semibold text-slate-900">{item.title}</h3><p className="mt-1 text-sm text-slate-500">{item.description || label(item.type)}</p><p className="mt-2 text-xs text-slate-400">{formatDateTime(item.createdAt)}</p></div><div className="flex flex-wrap gap-3 text-sm"><button type="button" onClick={() => onOpenCase(item)} className="inline-flex items-center gap-1.5 font-semibold text-pink-600"><FolderOpen className="h-4 w-4" /> Open case</button>{item.primaryMemberId && <><button type="button" onClick={() => onOpenMember(item.primaryMemberId)} className="inline-flex items-center gap-1.5 font-semibold text-pink-600"><UserRound className="h-4 w-4" /> Open user</button><button type="button" onClick={() => onOpenConversation(item.primaryMemberId!)} className="inline-flex items-center gap-1.5 font-semibold text-pink-600"><MessageSquare className="h-4 w-4" /> Conversation</button></>}</div></div></article>)}</div>}</section>;
}

function EventSection({ title, empty, events, snapshot, onOpenCase, onOpenMember, markReviewed }: { title: string; empty: string; events: ModerationEvent[]; snapshot: ModerationSnapshot | null; onOpenCase: (caseId: string) => void; onOpenMember: (id: string | null) => void; markReviewed: boolean }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">{title}</h2></header>{events.length === 0 ? <Empty text={empty} /> : <div className="divide-y divide-slate-100">{events.map(event => <article key={event.id} className="p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${event.severity === 'critical' || event.severity === 'error' ? 'bg-red-500' : event.severity === 'warning' ? 'bg-orange-500' : 'bg-emerald-500'}`} /><h3 className="font-semibold text-slate-900">{event.summary ?? label(event.eventType)}</h3></div><p className="mt-1 text-xs text-slate-400">{label(event.category)} · {formatDateTime(event.createdAt)}</p></div><div className="flex flex-wrap gap-3 text-sm">{event.relatedCaseId && snapshot?.cases.some(item => item.id === event.relatedCaseId) && <button type="button" onClick={() => onOpenCase(event.relatedCaseId!)} className="inline-flex items-center gap-1.5 font-semibold text-pink-600"><FolderOpen className="h-4 w-4" /> Open case</button>}{event.relatedMemberId && <button type="button" onClick={() => onOpenMember(event.relatedMemberId)} className="inline-flex items-center gap-1.5 font-semibold text-pink-600"><UserRound className="h-4 w-4" /> Open user</button>}<button type="button" disabled={!markReviewed} title={markReviewed ? 'Mark reviewed' : 'Review backend unavailable'} className="inline-flex cursor-not-allowed items-center gap-1.5 font-semibold text-slate-300"><ExternalLink className="h-4 w-4" /> Mark reviewed</button></div></div></article>)}</div>}</section>;
}

function Empty({ text }: { text: string }) {
  return <div className="p-10 text-center text-sm text-slate-500"><ShieldCheck className="mx-auto mb-3 h-7 w-7 text-slate-300" />{text}</div>;
}
