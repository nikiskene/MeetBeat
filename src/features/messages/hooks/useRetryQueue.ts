//src/features/messages/hooks/useRetryQueue.ts

import { useCallback, useState } from 'react';

export type RetryMessage = {
  id: string;
};

export function useRetryQueue() {
  const [failed, setFailed] = useState<Record<string, true>>({});

  const markFailed = useCallback((id: string) => {
    setFailed(prev => ({
      ...prev,
      [id]: true,
    }));
  }, []);

  const clearFailed = useCallback((id: string) => {
    setFailed(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  const isFailed = useCallback(
    (id: string) => Boolean(failed[id]),
    [failed]
  );

  return {
    markFailed,
    clearFailed,
    isFailed,
  };
}