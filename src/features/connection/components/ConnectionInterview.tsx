import { useMemo, useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import ErrorMessage from '../../../shared/components/ErrorMessage';
import { CONNECTION_QUESTIONS, connectionSummary } from '../services/connectionModel';
import {
  loadConnectionDraft,
  saveConnectionDraft,
  saveConnectionProfile,
} from '../services/connectionProfile';
import type { StoredConnectionProfile } from '../types/connection.types';

type Props = {
  onCompleted: (profile: StoredConnectionProfile) => void;
  onCancel?: () => void;
};

export function ConnectionInterview({ onCompleted, onCancel }: Props) {
  const { user } = useAuth();
  const initial = useMemo(loadConnectionDraft, []);
  const [answers, setAnswers] = useState<Record<string, string>>(initial);
  const [index, setIndex] = useState(() => {
    const firstMissing = CONNECTION_QUESTIONS.findIndex(question => !initial[question.id]);
    return firstMissing < 0 ? 9 : firstMissing;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const question = CONNECTION_QUESTIONS[index];

  function choose(answerId: string) {
    const next = { ...answers, [question.id]: answerId };
    setAnswers(next);
    saveConnectionDraft(next);
  }

  async function finish() {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      onCompleted(await saveConnectionProfile(user.id, answers));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your connection profile could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfcf9] px-5 py-8 md:px-10">
      <main className="mx-auto max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#b07d6c]">Your connection profile</p>
        <h1 className="mt-2 text-4xl font-light text-[#171513]">How do you naturally connect?</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[#333333]/60">
          Ten quick questions help BEAT understand your communication style and show you more relevant people first. There are no right answers and no boxes you need to fit into.
        </p>

        <div className="mt-8 h-1 overflow-hidden rounded-full bg-[#e8e0d0]">
          <div className="h-full rounded-full bg-[#b07d6c] transition-all" style={{ width: `${((index + 1) / 10) * 100}%` }} />
        </div>
        <p className="mt-3 text-xs font-medium text-[#333333]/50">Question {index + 1} of 10</p>
        <h2 className="mt-5 text-3xl font-light leading-tight text-[#171513]">{question.text}</h2>

        <div className="mt-7 space-y-3">
          {question.answers.map(answer => {
            const selected = answers[question.id] === answer.id;
            return (
              <button
                key={answer.id}
                type="button"
                aria-pressed={selected}
                onClick={() => choose(answer.id)}
                className={`flex min-h-16 w-full items-center justify-between rounded-2xl border p-4 text-left text-base transition ${selected ? 'border-[#b07d6c] bg-[#f5ede8]' : 'border-[#e8e0d0] bg-white hover:border-[#c9a090]'}`}
              >
                <span>{answer.text}</span>
                {selected ? <CheckCircle2 className="text-[#b07d6c]" /> : <Circle className="text-[#333333]/25" />}
              </button>
            );
          })}
        </div>

        {error && <div className="mt-5"><ErrorMessage>{error}</ErrorMessage></div>}
        <div className="mt-8 flex items-center justify-between gap-4">
          <button type="button" onClick={index === 0 && onCancel ? onCancel : () => setIndex(value => value - 1)} disabled={index === 0 && !onCancel || saving} className="px-3 py-3 text-sm font-medium disabled:opacity-30">
            {index === 0 && onCancel ? 'Cancel' : 'Back'}
          </button>
          <button type="button" onClick={index === 9 ? () => void finish() : () => setIndex(value => value + 1)} disabled={!answers[question.id] || saving} className="min-w-44 rounded-full bg-[#171513] px-6 py-3.5 text-sm font-medium text-white disabled:opacity-40">
            {saving ? 'Saving…' : index === 9 ? 'See my profile' : 'Next'}
          </button>
        </div>
      </main>
    </div>
  );
}

export function ConnectionResult({ stored, onContinue }: { stored: StoredConnectionProfile; onContinue: () => void }) {
  return (
    <div className="min-h-screen bg-[#fdfcf9] px-5 py-10 md:px-10">
      <main className="mx-auto max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#b07d6c]">Your connection profile</p>
        <h1 className="mt-2 text-4xl font-light">This is how you tend to connect.</h1>
        <div className="mt-8 rounded-[2rem] border border-[#e8e0d0] bg-white p-6 text-center text-2xl font-medium shadow-sm">
          {stored.profile.identifier}
        </div>
        <p className="mt-7 text-base leading-7 text-[#333333]/80">{connectionSummary(stored.profile)}</p>
        <p className="mt-5 text-sm leading-6 text-[#333333]/50">This profile helps BEAT rank compatible people. It does not decide who you can meet.</p>
        <button type="button" onClick={onContinue} className="mt-8 w-full rounded-full bg-[#171513] px-6 py-4 text-sm font-medium text-white">Choose today’s BEAT</button>
      </main>
    </div>
  );
}
