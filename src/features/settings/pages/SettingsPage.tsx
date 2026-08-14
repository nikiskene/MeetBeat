// src/features/settings/pages/SettingsPage.tsx
import { useEffect, useState } from 'react';
import { AlertTriangle, Download, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import ErrorMessage from '../../../shared/components/ErrorMessage';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import PageHeader from '../../../shared/components/PageHeader';
import { DiscoverySettingsForm } from '../components/DiscoverySettingsForm';
import {
  fetchDiscoverySettings,
  saveDiscoverySettings,
} from '../services/discoverySettings';
import type { DiscoverySettings } from '../types/settings.types';

type Acceptance = {
  document: string;
  title: string;
  version: string;
  accepted_at: string;
};

type DeletionRequest = {
  id: string;
  scheduled_for: string;
  created_at: string;
};

type PrivacyStatus = {
  acceptances: Acceptance[];
  deletion_request: DeletionRequest | null;
};

const EMPTY_PRIVACY: PrivacyStatus = { acceptances: [], deletion_request: null };

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<DiscoverySettings | null>(null);
  const [privacy, setPrivacy] = useState<PrivacyStatus>(EMPTY_PRIVACY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetchDiscoverySettings(user.id),
      supabase.rpc('get_my_privacy_status'),
    ])
      .then(([discovery, privacyResult]) => {
        if (privacyResult.error) throw privacyResult.error;
        setSettings(discovery);
        setPrivacy((privacyResult.data as PrivacyStatus | null) ?? EMPTY_PRIVACY);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load settings.'))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError('');
    try {
      await saveDiscoverySettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  async function downloadData() {
    setPrivacyBusy(true);
    setError('');
    try {
      const { data, error: exportError } = await supabase.rpc('get_my_data_export');
      if (exportError) throw exportError;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `beat-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your data export.');
    } finally {
      setPrivacyBusy(false);
    }
  }

  async function requestDeletion() {
    if (deletePhrase !== 'DELETE MY ACCOUNT') return;
    setPrivacyBusy(true);
    setError('');
    try {
      const { data, error: requestError } = await supabase.rpc('request_account_deletion', {
        p_reason: deleteReason || null,
      });
      if (requestError) throw requestError;
      setPrivacy(current => ({ ...current, deletion_request: data as DeletionRequest }));
      setShowDelete(false);
      setDeletePhrase('');
      setDeleteReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request account deletion.');
    } finally {
      setPrivacyBusy(false);
    }
  }

  async function cancelDeletion() {
    setPrivacyBusy(true);
    setError('');
    try {
      const { error: cancelError } = await supabase.rpc('cancel_account_deletion');
      if (cancelError) throw cancelError;
      setPrivacy(current => ({ ...current, deletion_request: null }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel account deletion.');
    } finally {
      setPrivacyBusy(false);
    }
  }

  if (!user) return null;
  if (loading || !settings) {
    return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 md:px-8">
      <PageHeader title="Settings" subtitle="Choose who BEAT should introduce you to." />
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <DiscoverySettingsForm
        settings={settings}
        saving={saving}
        saved={saved}
        onChange={setSettings}
        onSave={handleSave}
      />

      <section className="mt-10 space-y-4" aria-labelledby="privacy-account-heading">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#333333]/45">Privacy</p>
          <h2 id="privacy-account-heading" className="mt-1 text-2xl font-light text-[#171717]">Your data and account</h2>
        </div>

        <div className="rounded-2xl border border-[#dedbd3] bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-[#8f7b55]" size={21} />
            <div className="min-w-0">
              <h3 className="font-medium text-[#171717]">Legal agreements</h3>
              {privacy.acceptances.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-[#333333]/65">
                  {privacy.acceptances.map(item => (
                    <li key={`${item.document}-${item.version}`}>
                      {item.title} · version {item.version} · accepted {new Date(item.accepted_at).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#333333]/60">
                  No durable acceptance record is available for this older account. Current terms remain available below.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#dedbd3] bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-medium text-[#171717]">Download my data</h3>
              <p className="mt-1 text-sm leading-6 text-[#333333]/60">Create a portable JSON copy of your account, profile, matches, messages, settings, and activity.</p>
            </div>
            <button type="button" onClick={downloadData} disabled={privacyBusy}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#cfc9bd] px-4 text-sm font-medium text-[#171717] transition hover:bg-[#f4f1ea] disabled:opacity-50">
              <Download size={17} /> Download
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 sm:p-6">
          {privacy.deletion_request ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-medium text-red-900">Account deletion scheduled</h3>
                <p className="mt-1 text-sm leading-6 text-red-800/70">
                  Scheduled for {new Date(privacy.deletion_request.scheduled_for).toLocaleDateString()}. You can cancel during the 7-day recovery period.
                </p>
              </div>
              <button type="button" onClick={cancelDeletion} disabled={privacyBusy}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 text-sm font-medium text-red-800 disabled:opacity-50">
                <XCircle size={17} /> Cancel request
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-medium text-red-900">Delete account</h3>
                <p className="mt-1 text-sm leading-6 text-red-800/70">Request permanent deletion with a 7-day recovery period. Some records may be retained where legally required.</p>
              </div>
              <button type="button" onClick={() => setShowDelete(true)}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-medium text-white transition hover:bg-red-800">
                <Trash2 size={17} /> Request deletion
              </button>
            </div>
          )}
        </div>
      </section>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 shrink-0 text-red-700" size={22} />
              <div>
                <h2 id="delete-account-title" className="text-xl font-medium text-[#171717]">Request account deletion?</h2>
                <p className="mt-2 text-sm leading-6 text-[#333333]/65">Your request can be cancelled for 7 days. After that, deletion must be completed by the authorized operations workflow.</p>
              </div>
            </div>
            <label className="mt-5 block text-sm font-medium text-[#171717]" htmlFor="delete-reason">Reason (optional)</label>
            <textarea id="delete-reason" value={deleteReason} onChange={event => setDeleteReason(event.target.value)} rows={3}
              className="mt-2 w-full rounded-xl border border-[#d8d3c9] px-3 py-2 text-sm focus:border-[#8f7b55] focus:outline-none" />
            <label className="mt-4 block text-sm font-medium text-[#171717]" htmlFor="delete-confirm">Type DELETE MY ACCOUNT to confirm</label>
            <input id="delete-confirm" value={deletePhrase} onChange={event => setDeletePhrase(event.target.value)} autoComplete="off"
              className="mt-2 w-full rounded-xl border border-[#d8d3c9] px-3 py-3 text-sm focus:border-red-600 focus:outline-none" />
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowDelete(false)} className="min-h-11 rounded-xl border border-[#d8d3c9] px-4 text-sm font-medium">Keep my account</button>
              <button type="button" onClick={requestDeletion} disabled={privacyBusy || deletePhrase !== 'DELETE MY ACCOUNT'} className="min-h-11 rounded-xl bg-red-700 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">Schedule deletion</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
