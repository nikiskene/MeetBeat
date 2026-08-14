// src/features/messages/utils/messageStatus.ts

import type { Message } from '../types/messages.types';

export type UiMessageStatus =
  | 'sending'
  | 'failed'
  | 'sent'
  | 'delivered'
  | 'read';

export function getMessageStatus(
  message: Pick<
    Message,
    'read_at' | 'delivered_at'
  > & {
    pending?: boolean;
    failed?: boolean;
  }
): UiMessageStatus {
  if (message.pending) return 'sending';

  if (message.failed) return 'failed';

  if (message.read_at) return 'read';

  if (message.delivered_at) return 'delivered';

  return 'sent';
}