// src/features/admin/cms/hooks/useCms.ts

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCmsContent,
  saveCmsContent,
  setCmsActive,
} from '../services/cms.service';
import type {
  CmsContent,
  CmsContentInput,
  CmsFiltersState,
} from '../types/cms.types';

const initialFilters: CmsFiltersState = {
  search: '',
  namespace: '',
  contentGroup: '',
  locale: '',
};

export function useCms() {
  const [content, setContent] = useState<CmsContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] =
    useState<CmsFiltersState>(initialFilters);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const entries = await getCmsContent();
      setContent(entries);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load CMS content.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(item: CmsContentInput) {
    await saveCmsContent(item);
    await load();
  }

  async function toggle(item: CmsContent) {
    await setCmsActive(item.id, !item.is_active);
    await load();
  }

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return content.filter(item => {
      if (
        search &&
        ![
          item.content_key,
          item.namespace,
          item.content_group,
          item.locale,
          item.title ?? '',
          item.value,
          item.description ?? '',
          item.platform,
          ...item.tags,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search)
      ) {
        return false;
      }

      if (
        filters.namespace &&
        item.namespace !== filters.namespace
      ) {
        return false;
      }

      if (
        filters.contentGroup &&
        item.content_group !== filters.contentGroup
      ) {
        return false;
      }

      if (filters.locale && item.locale !== filters.locale) {
        return false;
      }

      return true;
    });
  }, [content, filters]);

  return {
    loading,
    error,
    content: filtered,
    allContent: content,
    filters,
    setFilters,
    reload: load,
    save,
    toggle,
  };
}