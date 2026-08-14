// src/features/messages/components/MessageBubble.tsx

import type { Message } from '../types/messages.types';
import MessageStatus from './MessageStatus';
import RetryBubble from './RetryBubble';

type Props = {
  message: Message;
  isOwn: boolean;
  failed?: boolean;
  onRetry?: (message: Message) => void;
};

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessageBubble({
  message,
  isOwn,
  failed = false,
  onRetry,
}: Props) {
  return (
    <div
      className={`flex flex-col ${
        isOwn ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 ${
          isOwn
            ? 'bg-black text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div className="whitespace-pre-wrap break-words text-sm">
          {message.content}
        </div>

        {isOwn && failed && (
          <div className="mt-2">
            <RetryBubble
              failed={failed}
              onRetry={() => onRetry?.(message)}
            />
          </div>
        )}
      </div>

      <div
        className={`mt-1 flex items-center gap-2 px-1 text-[11px] ${
          isOwn
            ? 'text-gray-400'
            : 'text-gray-400'
        }`}
      >
        <span>{formatTime(message.created_at)}</span>

        {isOwn && !failed && (
          <MessageStatus message={message} />
        )}
      </div>
    </div>
  );
}