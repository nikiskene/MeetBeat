// src/features/messages/hooks/useConversations.ts

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import type { Conversation } from '../types/messages.types';
import { fetchMyMatches } from '../services/messageService';

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await fetchMyMatches(user.id);
      setConversations(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load conversations.'
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateConversation = useCallback(
    (conversation: Conversation) => {
      setConversations(prev =>
        prev.map(c => (c.id === conversation.id ? conversation : c))
      );
    },
    []
  );

  const removeConversation = useCallback((matchId: string) => {
    setConversations(prev =>
      prev.filter(c => c.id !== matchId)
    );
  }, []);

  return {
    conversations,
    loading,
    error,
    reload,
    updateConversation,
    removeConversation,
    setConversations,
  };
}
