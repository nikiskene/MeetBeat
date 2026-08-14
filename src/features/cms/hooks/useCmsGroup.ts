// src/features/cms/hooks/useCmsGroup.ts

import { useCallback, useEffect, useState } from 'react';
import {
  fetchCmsEntries,
  toCmsMap,
  type CmsEntry,
  type CmsMap,
} from '../services/cmsContent';

export type { CmsEntry, CmsMap };

type State = {
  entries: CmsEntry[];
  content: CmsMap;
  loading: boolean;
  error: string;
  reload: () => void;
};

export function useCmsGroup(contentGroup: string): State {
  const [entries, setEntries] = useState<CmsEntry[]>([]);
  const [content, setContent] = useState<CmsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const nextEntries = await fetchCmsEntries(contentGroup);
      setEntries(nextEntries);
      setContent(toCmsMap(nextEntries));
    } catch (err) {
      setEntries([]);
      setContent({});
      setError(
        err instanceof Error ? err.message : 'Content unavailable.',
      );
    } finally {
      setLoading(false);
    }
  }, [contentGroup, retryKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    entries,
    content,
    loading,
    error,
    reload: () => setRetryKey(key => key + 1),
  };
}

export function pick(
  content: CmsMap,
  key: string,
  fallback: string,
): string {
  const value = content[key];
  return value && value.trim().length > 0 ? value : fallback;
}