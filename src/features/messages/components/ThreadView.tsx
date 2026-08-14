// src/features/messages/components/ThreadView.tsx

import { useEffect, type RefObject } from 'react';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import type {
  Conversation,
  Message,
} from '../types/messages.types';
import MessageBubble from './MessageBubble';

type Props = {
  conversation: Conversation;
  messages: Message[];
  loading: boolean;
  userId?: string;
  messagesEndRef?: RefObject<HTMLDivElement>;
};

export function ThreadView({
  conversation,
  messages,
  loading,
  userId,
  messagesEndRef,
}: Props) {
  useEffect(() => {
    messagesEndRef?.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, messagesEndRef]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-8 text-center text-sm text-gray-500">
        Start your conversation with{' '}
        {conversation.profile.display_name ?? 'your match'}.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
      {messages.map(message => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={message.sender_id === userId}
        />
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}