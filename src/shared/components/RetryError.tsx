import { RefreshCw } from 'lucide-react';
import ErrorMessage from './ErrorMessage';

type Props = {
  message: string;
  onRetry: () => void;
};

export default function RetryError({ message, onRetry }: Props) {
  return (
    <div className="space-y-3" role="alert">
      <ErrorMessage>{message}</ErrorMessage>
      <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 rounded-full border border-[#e8e0d0] bg-white px-4 py-2 text-sm font-medium text-[#141414] transition hover:bg-[#f2ede3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b07d6c]">
        <RefreshCw size={14} /> Try again
      </button>
    </div>
  );
}
