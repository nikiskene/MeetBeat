// src/features/messages/components/ReportDialog.tsx

import { useState } from 'react';
import type { ReportReason } from '../types/messages.types';

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => Promise<void>;
};

const reasons: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' },
];

export default function ReportDialog({
  open,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');

  if (!open) return null;

  async function handleSubmit() {
    await onSubmit(reason, details);
    setDetails('');
    setReason('spam');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-5 text-lg font-semibold">
          Report user
        </h2>

        <label className="mb-2 block text-sm font-medium">
          Reason
        </label>

        <select
          value={reason}
          onChange={e => setReason(e.target.value as ReportReason)}
          className="mb-4 w-full rounded-lg border px-3 py-2"
        >
          {reasons.map(r => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <label className="mb-2 block text-sm font-medium">
          Details (optional)
        </label>

        <textarea
          rows={5}
          value={details}
          onChange={e => setDetails(e.target.value)}
          className="mb-6 w-full rounded-lg border px-3 py-2"
          placeholder="Describe what happened..."
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Submit report
          </button>
        </div>
      </div>
    </div>
  );
}