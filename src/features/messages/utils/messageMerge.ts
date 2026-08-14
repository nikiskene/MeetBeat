// src/features/messages/utils/messageMerge.ts

import type { Message } from '../types/messages.types';

export function mergeMessage(
  messages: Message[],
  incoming: Message
): Message[] {
  const index = messages.findIndex(m => m.id === incoming.id);

  if (index === -1) {
    return [...messages, incoming].sort(
      (a, b) =>
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
    );
  }

  const updated = [...messages];
  updated[index] = {
    ...updated[index],
    ...incoming,
  };

  return updated;
}

export function mergeMessages(
  existing: Message[],
  incoming: Message[]
): Message[] {
  let result = [...existing];

  for (const message of incoming) {
    result = mergeMessage(result, message);
  }

  return result;
}