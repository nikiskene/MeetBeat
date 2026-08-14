// src/features/messages/services/messageService.ts

import { supabase } from '../../../lib/supabase';
import type {
  Conversation,
  Message,
} from '../types/messages.types';

type MatchRpcRow = {
  id: string;
  matched_user_id: string;
  display_name?: string;
  avatar_url?: string;
  created_at?: string;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count?: number | null;
};

type MessageChangeHandlers = {
  onInsert: (message: Message) => void;
  onUpdate: (message: Message) => void;
};

function mapConversation(
  row: MatchRpcRow,
  userId: string
): Conversation {
  return {
    id: row.id,
    user_id: userId,
    other_user_id: row.matched_user_id,
    last_message: row.last_message ?? null,
    updated_at:
      row.last_message_at ??
      row.created_at ??
      new Date().toISOString(),
    unread_count: row.unread_count ?? 0,
    profile: {
      display_name: row.display_name,
      avatar_url: row.avatar_url,
    },
  };
}

export async function fetchConversations(
  userId: string
): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc(
    'get_my_matches'
  );

  if (error) throw error;

  return ((data ?? []) as MatchRpcRow[]).map(row =>
    mapConversation(row, userId)
  );
}

export const fetchMyMatches = fetchConversations;

export async function fetchMessages(
  matchId: string
): Promise<Message[]> {
  const { data, error } = await supabase.rpc(
    'get_match_messages',
    {
      p_match_id: matchId,
    }
  );

  if (error) throw error;

  return (data ?? []) as Message[];
}

export async function createOrOpenConversation(
  otherUserId: string
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'get_my_matches'
  );

  if (error) throw error;

  const match = ((data ?? []) as MatchRpcRow[]).find(
    row => row.matched_user_id === otherUserId
  );

  if (!match) {
    throw new Error('No match exists.');
  }

  return match.id;
}

export async function createMessage(
  matchId: string,
  _senderId: string,
  content: string
): Promise<Message> {
  const { data, error } = await supabase.rpc(
    'send_match_message',
    {
      p_match_id: matchId,
      p_content: content,
    }
  );

  if (error) throw error;

  const message = (data as Message[] | null)?.[0];

  if (!message) {
    throw new Error(
      'Message was sent but no message record was returned.'
    );
  }

  return message;
}

export const sendMessage = createMessage;

export async function markMessagesDelivered(
  matchId: string
): Promise<number> {
  const { data, error } = await supabase.rpc(
    'mark_match_messages_delivered',
    {
      p_match_id: matchId,
    }
  );

  if (error) throw error;

  return typeof data === 'number' ? data : 0;
}

export async function markMessagesRead(
  matchId: string
): Promise<number> {
  const { data, error } = await supabase.rpc(
    'mark_match_messages_read',
    {
      p_match_id: matchId,
    }
  );

  if (error) throw error;

  return typeof data === 'number' ? data : 0;
}

export function subscribeToMessageChanges(
  userId: string,
  handlers: MessageChangeHandlers
) {
  const channel = supabase
    .channel(`messages-${userId}`)

    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      payload => {
        handlers.onInsert(payload.new as Message);
      }
    )

    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
      },
      payload => {
        handlers.onUpdate(payload.new as Message);
      }
    )

    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}