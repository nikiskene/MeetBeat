// src/features/cms/services/cmsContent.ts

import { supabase } from '../../../lib/supabase';
import type { CmsContent } from '../../admin/cms/types/cms.types';

const CONTENT_TABLE = 'app_content';

export type CmsEntry = {
  content_key: string;
  value: string;
  title: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  sort_order: number;
};

export async function fetchCmsEntries(
  contentGroup: string,
): Promise<CmsEntry[]> {
  const { data, error } = await supabase
    .from(CONTENT_TABLE)
    .select(
      'content_key, value, title, description, metadata, sort_order',
    )
    .eq('namespace', 'app')
    .eq('content_group', contentGroup)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('content_key', { ascending: true });

  if (error) {
    throw new Error(`Unable to load CMS content: ${error.message}`);
  }

  return (data ?? []) as CmsEntry[];
}

export type CmsMap = Record<string, string>;

export function toCmsMap(entries: CmsEntry[]): CmsMap {
  return entries.reduce<CmsMap>((acc, entry) => {
    acc[entry.content_key] = entry.value;
    return acc;
  }, {});
}

export type { CmsContent };