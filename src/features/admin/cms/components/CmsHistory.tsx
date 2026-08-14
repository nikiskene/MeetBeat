// src/features/admin/cms/components/CmsHistory.tsx

import { useEffect, useState } from 'react';
import { getCmsHistory } from '../services/cms.service';
import type {
  CmsContent,
  CmsHistoryEntry,
} from '../types/cms.types';

type Props = {
  item: CmsContent | null;
};

export default function CmsHistory({ item }: Props) {
  const [history, setHistory] = useState<CmsHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    if (!item) {
      setHistory([]);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    getCmsHistory(item.id)
      .then(entries => {
        if (active) setHistory(entries);
      })
      .catch(err => {
        if (!active) return;

        setHistory([]);
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load content history.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [item]);

  if (!item) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          History
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Previous versions and recorded changes.
        </p>
      </div>

      {loading && (
        <p className="mt-4 text-sm text-slate-500">
          Loading history…
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          No previous changes recorded.
        </p>
      )}

      {!loading && !error && history.length > 0 && (
        <div className="mt-4 space-y-3">
          {history.map(entry => {
            const valueChanged =
              entry.old_data?.value !== entry.new_data?.value;

            return (
              <article
                key={entry.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date(entry.changed_at).toLocaleString()}
                  </p>

                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                    Version{' '}
                    {entry.old_data?.content_version ?? '—'} to{' '}
                    {entry.new_data?.content_version ?? '—'}
                  </span>
                </div>

                {valueChanged && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <HistoryValue
                      label="Previous"
                      value={entry.old_data?.value ?? ''}
                      muted
                    />

                    <HistoryValue
                      label="Updated"
                      value={entry.new_data?.value ?? ''}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function HistoryValue({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 whitespace-pre-wrap break-words text-sm ${
          muted ? 'text-slate-500' : 'text-slate-800'
        }`}
      >
        {value || 'Empty'}
      </p>
    </div>
  );
}