// src/pages/AdminUsersPage.tsx
import { type FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Mail, MapPin, Search, ShieldBan, UserRound, X } from 'lucide-react';
import {
  type AdminUser,
  fetchAdminUsers,
  setAdminUserSuspended,
} from '../features/admin/services/adminUsers';

type Props = {
  onBack: () => void;
  onMessageUser: (userId: string) => void;
};

const PAGE_SIZE = 10;
const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'Never';
const locationLabel = (user: AdminUser) => [user.city, user.country].filter(Boolean).join(', ') || 'Not provided';

export default function AdminUsersPage({ onBack, onMessageUser }: Props) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchAdminUsers({ search, page, pageSize: PAGE_SIZE })
      .then(result => {
        if (!active) return;
        setUsers(result.users);
        setTotal(result.total);
      })
      .catch(err => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load users.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [search, page, retry]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(query.trim());
  };

  const openStatusDialog = (user: AdminUser) => {
    setSelected(user);
    setReason('');
    setError(null);
  };

  const changeStatus = async () => {
    if (!selected) return;
    const suspending = selected.status === 'Active';
    if (suspending && !reason.trim()) {
      setError('Add a reason before suspending this member.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setAdminUserSuspended(selected.id, suspending, reason);
      setSelected(null);
      setRetry(value => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update member status.');
    } finally {
      setSaving(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const actionButtons = (user: AdminUser) => (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => onMessageUser(user.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-purple-300 hover:text-purple-700">
        Message
      </button>
      <button type="button" onClick={() => openStatusDialog(user)} className={
        'rounded-lg px-3 py-2 text-sm font-medium ' +
        (user.status === 'Active' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')
      }>
        {user.status === 'Active' ? 'Suspend' : 'Reactivate'}
      </button>
    </div>
  );

  return (
    <section className="min-w-0 space-y-5" aria-labelledby="admin-users-title">
      <div className="flex items-start gap-3">
        <button type="button" onClick={onBack} aria-label="Back to Admin overview" className="mt-1 rounded-full p-2 text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 id="admin-users-title" className="text-2xl font-bold text-slate-900 sm:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-slate-600">Search, review, message, suspend, or reactivate registered members.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total users</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Active on page</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{users.filter(user => user.status === 'Active').length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Locations supplied</p>
          <p className="mt-1 text-2xl font-bold text-purple-700">{users.filter(user => user.city || user.country).length}</p>
        </div>
      </div>

      <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="admin-user-search">Search users</label>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input id="admin-user-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, email, city, or country" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-base outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
        </div>
        <button type="submit" className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700">Search</button>
      </form>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="flex items-center justify-center gap-2 py-12 text-slate-600"><Loader2 className="h-5 w-5 animate-spin" /> Loading users…</div>}
      {!loading && !error && users.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-600">No users match this search.</div>}

      {!loading && users.length > 0 && (
        <>
          <div className="space-y-3 md:hidden">
            {users.map(user => (
              <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex min-w-0 items-start gap-3">
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700"><UserRound className="h-6 w-6" /></div>}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="min-w-0 truncate font-semibold text-slate-900">{user.displayName}</h2>
                      <span className={'rounded-full px-2 py-0.5 text-xs font-semibold ' + (user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>{user.status}</span>
                    </div>
                    <p className="mt-1 flex min-w-0 items-center gap-1 text-sm text-slate-600"><Mail className="h-4 w-4 shrink-0" /><span className="truncate">{user.email ?? 'No email'}</span></p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><MapPin className="h-4 w-4 shrink-0" />{locationLabel(user)}</p>
                  </div>
                </div>
                <dl className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                  <div><dt className="text-slate-500">Last active</dt><dd className="font-medium text-slate-800">{formatDate(user.lastActiveAt)}</dd></div>
                  <div><dt className="text-slate-500">Joined</dt><dd className="font-medium text-slate-800">{formatDate(user.createdAt)}</dd></div>
                </dl>
                {actionButtons(user)}
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last active</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => <tr key={user.id} className="align-middle"><td className="px-4 py-3 font-semibold text-slate-900">{user.displayName}</td><td className="px-4 py-3 text-slate-600">{user.email ?? 'No email'}</td><td className="px-4 py-3"><span className={'rounded-full px-2 py-1 text-xs font-semibold ' + (user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>{user.status}</span></td><td className="px-4 py-3 text-slate-600">{formatDate(user.lastActiveAt)}</td><td className="px-4 py-3 text-slate-600">{locationLabel(user)}</td><td className="px-4 py-3 text-slate-600">{formatDate(user.createdAt)}</td><td className="px-4 py-3">{actionButtons(user)}</td></tr>)}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex items-center justify-between gap-3">
        <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(value => Math.max(1, value - 1))} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-40">Previous</button>
        <p className="text-sm text-slate-600">Page {page} of {pages}</p>
        <button type="button" disabled={page >= pages || loading} onClick={() => setPage(value => Math.min(pages, value + 1))} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-40">Next</button>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="member-status-title">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3"><div><h2 id="member-status-title" className="text-xl font-bold text-slate-900">{selected.status === 'Active' ? 'Suspend member' : 'Reactivate member'}</h2><p className="mt-1 text-sm text-slate-600">{selected.displayName} · {selected.email}</p></div><button type="button" onClick={() => setSelected(null)} aria-label="Close" className="rounded-full p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            {selected.status === 'Active' && <div className="mt-4"><label htmlFor="suspension-reason" className="text-sm font-semibold text-slate-700">Reason</label><textarea id="suspension-reason" value={reason} onChange={event => setReason(event.target.value)} rows={3} placeholder="Required for the audit log" className="mt-1 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /></div>}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold">Cancel</button><button type="button" onClick={changeStatus} disabled={saving} className={'flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-50 ' + (selected.status === 'Active' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700')}>{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldBan className="h-5 w-5" />}{selected.status === 'Active' ? 'Confirm suspension' : 'Reactivate member'}</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
