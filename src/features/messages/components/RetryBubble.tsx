// src/features/messages/components/RetryBubble.tsx

import { AlertCircle, RefreshCw } from 'lucide-react';

type Props = {
  failed: boolean;
  onRetry: () => void;
};

export default function RetryBubble({
  failed,
  onRetry,
}: Props) {
  if (!failed) return null;

  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      <span className="flex items-center gap-1 text-red-500">
        <AlertCircle size={14} />
        Failed to send
      </span>

      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 transition hover:bg-neutral-100"
      >
        <RefreshCw size={13} />
        Retry
      </button>
    </div>
  );
}