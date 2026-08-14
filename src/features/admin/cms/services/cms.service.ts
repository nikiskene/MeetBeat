// src/features/admin/cms/services/cms.service.ts

import { supabase } from '../../../../lib/supabase';
import type {
  CmsContent,
  CmsContentInput,
  CmsHistoryEntry,
} from '../types/cms.types';

const CONTENT_TABLE = 'app_content';
const HISTORY_TABLE = 'app_content_history';

export async function getCmsContent(): Promise<CmsContent[]> {
  const { data, error } = await supabase
    .from(CONTENT_TABLE)
    .select('*')
    .order('namespace', { ascending: true })
    .order('content_group', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('content_key', { ascending: true });

  if (error) {
    throw new Error(`Unable to load CMS content: ${error.message}`);
  }

  return (data ?? []) as CmsContent[];
}

export async function saveCmsContent(
  content: CmsContentInput,
): Promise<CmsContent> {
  const payload = {
    ...content,
    content_key: content.content_key.trim(),
    namespace: content.namespace.trim(),
    content_group: content.content_group.trim(),
    locale: content.locale.trim(),
    title: content.title?.trim() || null,
    value: content.value.trim(),
    description: content.description?.trim() || null,
    platform: content.platform.trim(),
    tags: content.tags.map(tag => tag.trim()).filter(Boolean),
  };

  const { data, error } = await supabase
    .from(CONTENT_TABLE)
    .upsert(payload)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Unable to save CMS content: ${error.message}`);
  }

  return data as CmsContent;
}

export async function setCmsActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from(CONTENT_TABLE)
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) {
    throw new Error(
      `Unable to update content status: ${error.message}`,
    );
  }
}

export async function getCmsHistory(
  appContentId: string,
): Promise<CmsHistoryEntry[]> {
  const { data, error } = await supabase
    .from(HISTORY_TABLE)
    .select('*')
    .eq('app_content_id', appContentId)
    .order('changed_at', { ascending: false });

  if (error) {
    throw new Error(`Unable to load content history: ${error.message}`);
  }

  return (data ?? []) as CmsHistoryEntry[];
}