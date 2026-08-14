import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, Loader2, Megaphone, Send, Users } from 'lucide-react';
import {
  broadcastAudienceLabels,
  fetchAudienceEstimates,
  sendBroadcast,
  type AudienceEstimate,
  type BroadcastAudience,
} from '../features/admin/services/adminBroadcast';

type Props = { onBack: () => void };

const MAX_TITLE = 80;
const MAX_MESSAGE = 600;

export default function AdminBroadcastPage({ onBack }: Props) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<BroadcastAudience>('all_active');
  const [estimates, setEstimates] = useState<AudienceEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchAudienceEstimates()
      .then(result => { if (active) setEstimates(result); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load audience estimates.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const selectedEstimate = estimates.find(item => item.audience === audience)?.count;
  const valid = title.trim().length > 0 && message.trim().length > 0;
  const summary = useMemo(() => message.trim() || 'Your announcement message will appear here.', [message]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setPreview(true);
  };

  const confirmSend = async () => {
    setSending(true); setError(null);
    try {
      const result = await sendBroadcast({ title, message, audience });
      setSent(`Announcement queued for ${result.queuedDeliveries} members.`);
      setPreview(false); setTitle(''); setMessage('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to send announcement.'); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 font-medium text-pink-600 hover:text-pink-700"><ArrowLeft className="h-4 w-4" /> Admin</button>
        <span>/</span><span>Messages</span>
      </nav>

      <div><h1 className="text-2xl font-bold text-slate-900">Broadcast Center</h1><p className="mt-1 text-sm text-slate-500">Compose and send operator announcements through the member delivery queue.</p></div>

      {sent && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{sent}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <form onSubmit={submit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div><h2 className="font-semibold text-slate-900">Compose announcement</h2><p className="mt-1 text-sm text-slate-500">Announcements are separate from one-to-one messaging.</p></div>

          <label className="block"><span className="text-sm font-medium text-slate-700">Title</span><input value={title} onChange={event => setTitle(event.target.value.slice(0, MAX_TITLE))} placeholder="A clear announcement title" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" /><span className="mt-1 block text-right text-xs text-slate-400">{title.length}/{MAX_TITLE}</span></label>

          <label className="block"><span className="text-sm font-medium text-slate-700">Message</span><textarea value={message} onChange={event => setMessage(event.target.value.slice(0, MAX_MESSAGE))} rows={8} placeholder="Write the member-facing announcement" className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" /><span className="mt-1 block text-right text-xs text-slate-400">{message.length}/{MAX_MESSAGE}</span></label>

          <fieldset><legend className="text-sm font-medium text-slate-700">Audience</legend><div className="mt-2 grid gap-3 sm:grid-cols-3">{(Object.keys(broadcastAudienceLabels) as BroadcastAudience[]).map(value => { const estimate = estimates.find(item => item.audience === value)?.count; return <label key={value} className={`cursor-pointer rounded-xl border p-4 transition ${audience === value ? 'border-pink-300 bg-pink-50' : 'border-slate-200 hover:border-pink-200'}`}><input type="radio" name="audience" value={value} checked={audience === value} onChange={() => setAudience(value)} className="sr-only" /><span className="block text-sm font-semibold text-slate-800">{broadcastAudienceLabels[value]}</span><span className="mt-1 block text-xs text-slate-500">{loading ? 'Estimating…' : error ? 'Unavailable' : `${estimate ?? 0} members`}</span></label>; })}</div></fieldset>

          {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">Unable to load audience estimates: {error}</div>}

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button type="submit" disabled={!valid} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-40"><Eye className="h-4 w-4" /> Preview</button>
            <button type="button" onClick={() => setPreview(true)} disabled={!valid} className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"><Send className="h-4 w-4" /> Send announcement</button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Users className="h-4 w-4 text-pink-600" /> Selected audience</div>{loading ? <div className="mt-5 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Calculating audience…</div> : <><p className="mt-4 text-3xl font-bold text-slate-900">{selectedEstimate ?? '—'}</p><p className="mt-1 text-sm text-slate-500">{broadcastAudienceLabels[audience]}</p></>}</div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm"><div className="border-b border-slate-200 bg-white px-5 py-4"><div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Megaphone className="h-4 w-4 text-pink-600" /> Member preview</div></div><div className="p-5"><div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm"><span className="inline-flex rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-600">BEAT update</span><h3 className="mt-4 text-lg font-bold text-slate-900">{title.trim() || 'Announcement title'}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{summary}</p><div className="mt-5 flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Preview only — nothing has been sent</div></div></div></div>
        </aside>
      </div>

      {preview && <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-label="Announcement preview"><div className="w-full rounded-t-3xl bg-white p-6 shadow-xl sm:max-w-lg sm:rounded-3xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-pink-600">Announcement preview</p><h2 className="mt-1 text-xl font-bold text-slate-900">{title.trim()}</h2></div><button type="button" onClick={() => setPreview(false)} className="text-sm font-medium text-slate-500">Close</button></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{message.trim()}</p><div className="mt-5 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Audience: <span className="font-semibold">{broadcastAudienceLabels[audience]}</span>{selectedEstimate !== undefined && ` · ${selectedEstimate} members`}</div><button type="button" onClick={confirmSend} disabled={sending} className="mt-5 w-full rounded-xl bg-pink-600 py-3 text-sm font-semibold text-white disabled:opacity-50">{sending ? 'Sending…' : 'Confirm and send'}</button></div></div>}
    </div>
  );
}
