import { useEffect, useState } from 'react';
import { connectionSummary } from '../services/connectionModel';
import { fetchConnectionProfile } from '../services/connectionProfile';
import type { StoredConnectionProfile } from '../types/connection.types';
import { ConnectionInterview } from './ConnectionInterview';

export function ConnectionProfileSection({ userId }: { userId: string }) {
  const [stored, setStored] = useState<StoredConnectionProfile | null>(null);
  const [interview, setInterview] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => { void fetchConnectionProfile(userId).then(setStored).catch(() => undefined); }, [userId]);
  if (interview) {
    return <ConnectionInterview onCancel={() => setInterview(false)} onCompleted={result => { setStored(result); setInterview(false); }} />;
  }

  return (
    <section className="rounded-2xl border border-[#e8e0d0] bg-white p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-[#333333]/50">How I connect</p>
      <p className="mt-2 text-sm leading-6 text-[#333333]/60">Your connection profile helps BEAT understand which people may feel more natural to meet.</p>
      {stored ? (
        <>
          <h2 className="mt-5 text-xl font-medium">{stored.profile.identifier}</h2>
          <p className="mt-3 text-sm leading-6 text-[#333333]/70">{connectionSummary(stored.profile)}</p>
          <p className="mt-3 text-xs text-[#333333]/45">Profile created from BEAT Interview {stored.questionnaire_version} · completed {new Date(stored.completed_at).toLocaleDateString()}</p>
          <button type="button" onClick={() => setConfirming(true)} className="mt-5 text-sm font-medium text-[#8f5e50]">Retake interview</button>
        </>
      ) : (
        <button type="button" onClick={() => setInterview(true)} className="mt-5 rounded-full bg-[#171513] px-5 py-3 text-sm font-medium text-white">Complete connection interview</button>
      )}
      {confirming && (
        <div className="mt-5 rounded-xl bg-[#f9f6f0] p-4 text-sm">
          <p>Your new answers will replace your current connection profile and update future compatibility rankings.</p>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => { setConfirming(false); setInterview(true); }} className="font-medium text-[#8f5e50]">Retake interview</button>
            <button type="button" onClick={() => setConfirming(false)}>Keep current profile</button>
          </div>
        </div>
      )}
    </section>
  );
}
