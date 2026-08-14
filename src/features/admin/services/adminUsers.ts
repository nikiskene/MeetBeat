// src/features/admin/services/adminUsers.ts
import { supabase } from '../../../lib/supabase';

export type AdminUser = {
  id: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  status: 'Active' | 'Suspended';
  lastActiveAt: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
};

export type AdminUsersResult = {
  users: AdminUser[];
  total: number;
};

type FetchAdminUsersOptions = {
  search: string;
  page: number;
  pageSize: number;
};

type AdminUserRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_banned: boolean | null;
  last_active_at: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  total_count: number | string;
};

export async function fetchAdminUsers({ search, page, pageSize }: FetchAdminUsersOptions): Promise<AdminUsersResult> {
  const { data, error } = await supabase.rpc('get_admin_users', {
    p_search: search.trim() || null,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) throw error;

  const rows = (data ?? []) as AdminUserRow[];
  return {
    users: rows.map(row => ({
      id: row.id,
      displayName: row.display_name ?? row.email?.split('@')[0] ?? 'Unnamed user',
      email: row.email,
      avatarUrl: row.avatar_url,
      status: row.is_banned ? 'Suspended' : 'Active',
      lastActiveAt: row.last_active_at,
      city: row.city,
      country: row.country,
      createdAt: row.created_at,
    })),
    total: rows.length ? Number(rows[0].total_count) : 0,
  };
}

export async function setAdminUserSuspended(userId: string, suspended: boolean, reason?: string): Promise<void> {
  const { error } = await supabase.rpc('set_member_banned', {
    p_member_id: userId,
    p_banned: suspended,
    p_reason: suspended ? reason?.trim() || null : null,
  });
  if (error) throw error;
}
