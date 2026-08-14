// src/features/messages/hooks/useThread.ts

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  fetchMessages,
  markMessagesDelivered,
  markMessagesRead,
} from '../services/messageService';

import type { Message } from '../types/messages.types';
import {
  mergeMessage,
  mergeMessages,
} from '../utils/messageMerge';

export function useThread(
  matchId: string | null
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!matchId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const nextMessages = await fetchMessages(matchId);

      setMessages(previous =>
        mergeMessages(previous, nextMessages)
      );

      await markMessagesDelivered(matchId);
      await markMessagesRead(matchId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load messages.'
      );
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    setMessages([]);

    if (!matchId) {
      return;
    }

    void reload();
  }, [matchId, reload]);

  const appendMessage = useCallback(
    (message: Message) => {
      setMessages(previous =>
        mergeMessage(previous, message)
      );
    },
    []
  );

  const updateMessage = useCallback(
    (message: Message) => {
      setMessages(previous =>
        mergeMessage(previous, message)
      );
    },
    []
  );

  const removeMessage = useCallback(
    (messageId: string) => {
      setMessages(previous =>
        previous.filter(
          message => message.id !== messageId
        )
      );
    },
    []
  );

  const replaceMessage = useCallback(
    (
      messageId: string,
      replacement: Message
    ) => {
      setMessages(previous =>
        previous.map(message =>
          message.id === messageId
            ? replacement
            : message
        )
      );
    },
    []
  );

  return {
    messages,
    loading,
    error,
    reload,
    appendMessage,
    updateMessage,
    removeMessage,
    replaceMessage,
  };
}