// src/features/messages/utils/retryQueue.ts

import type { Message } from '../types/messages.types';

export type RetryableMessage = Message & {
  failed?: boolean;
  pending?: boolean;
};

export function markMessageFailed(
  messages: RetryableMessage[],
  messageId: string
): RetryableMessage[] {
  return messages.map(message =>
    message.id === messageId
      ? {
          ...message,
          failed: true,
          pending: false,
        }
      : message
  );
}

export function markMessagePending(
  messages: RetryableMessage[],
  messageId: string
): RetryableMessage[] {
  return messages.map(message =>
    message.id === messageId
      ? {
          ...message,
          pending: true,
          failed: false,
        }
      : message
  );
}

export function clearRetryState(
  messages: RetryableMessage[],
  messageId: string
): RetryableMessage[] {
  return messages.map(message =>
    message.id === messageId
      ? {
          ...message,
          pending: false,
          failed: false,
        }
      : message
  );
}