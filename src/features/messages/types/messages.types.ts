// src/features/messages/types/messages.types.ts

export type ProfileSummary = {
  display_name?: string | null;
  avatar_url?: string | null;
};

export type Conversation = {
  id: string;
  user_id: string;
  other_user_id: string;
  last_message: string | null;
  updated_at: string;
  unread_count: number;
  profile: ProfileSummary;
};

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  type: 'text';
  content: string;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
};

export type MessageStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'fake_profile'
  | 'inappropriate'
  | 'other';

export type ReportPayload = {
  reason: ReportReason;
  details?: string;
};

export type RealtimeMessageHandlers = {
  onInsert(message: Message): void;
  onUpdate(message: Message): void;
};