// src/features/messages/components/MessageStatus.tsx

import { Check, CheckCheck, Clock3 } from 'lucide-react';

import type { Message } from '../types/messages.types';

type Props = {
  message: Message;
  pending?: boolean;
};

export default function MessageStatus({
  message,
  pending = false,
}: Props) {
  if (pending) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-gray-400">
        <Clock3 size={12} />
        Sending
      </span>
    );
  }

  if (message.read_at) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-sky-600">
        <CheckCheck size={12} />
        Read
      </span>
    );
  }

  if (message.delivered_at) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-gray-500">
        <CheckCheck size={12} />
        Delivered
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-[11px] text-gray-500">
      <Check size={12} />
      Sent
    </span>
  );
}