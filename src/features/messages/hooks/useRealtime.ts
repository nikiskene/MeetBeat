// src/features/messages/hooks/useRealtime.ts

import { useEffect } from 'react';
import type { Message } from '../types/messages.types';
import { subscribeToMessageChanges } from '../services/messageService';

type Props = {
  userId: string;
  onInsert: (message: Message) => void;
  onUpdate: (message: Message) => void;
};

export function useRealtime({
  userId,
  onInsert,
  onUpdate,
}: Props) {
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToMessageChanges(userId, {
      onInsert,
      onUpdate,
    });

    return unsubscribe;
  }, [userId, onInsert, onUpdate]);
}