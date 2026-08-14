// src/features/admin/cms/types/cms.types.ts

export type CmsMetadata = Record<string, unknown>;

export type CmsContent = {
  id: string;
  content_key: string;
  namespace: string;
  content_group: string;
  locale: string;
  title: string | null;
  value: string;
  description: string | null;
  metadata: CmsMetadata;
  content_version: number;
  is_active: boolean;
  tags: string[];
  platform: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CmsHistoryEntry = {
  id: string;
  app_content_id: string;
  content_key: string;
  locale: string;
  old_data: CmsContent | null;
  new_data: CmsContent | null;
  changed_by: string | null;
  changed_at: string;
};

export type CmsContentInput = {
  id?: string;
  content_key: string;
  namespace: string;
  content_group: string;
  locale: string;
  title: string | null;
  value: string;
  description: string | null;
  metadata: CmsMetadata;
  content_version: number;
  is_active: boolean;
  tags: string[];
  platform: string;
  sort_order: number;
};

export type CmsFiltersState = {
  search: string;
  namespace: string;
  contentGroup: string;
  locale: string;
};