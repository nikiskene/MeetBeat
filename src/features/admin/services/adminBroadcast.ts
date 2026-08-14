import { supabase } from '../../../lib/supabase';

export type BroadcastAudience = 'all_active' | 'verified' | 'recently_active';

export type BroadcastDraft = {
  title: string;
  message: string;
  audience: BroadcastAudience;
};

export type AudienceEstimate = {
  audience: BroadcastAudience;
  count: number;
};

export const broadcastAudienceLabels: Record<BroadcastAudience, string> = {
  all_active: 'All active members',
  verified: 'Verified members',
  recently_active: 'Active in the last 30 days',
};

export async function fetchAudienceEstimates(): Promise<AudienceEstimate[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [allResult, verifiedResult, recentResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', false),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', false).eq('is_verified', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', false).gte('last_active_at', since),
  ]);

  const error = allResult.error ?? verifiedResult.error ?? recentResult.error;
  if (error) throw error;

  return [
    { audience: 'all_active', count: allResult.count ?? 0 },
    { audience: 'verified', count: verifiedResult.count ?? 0 },
    { audience: 'recently_active', count: recentResult.count ?? 0 },
  ];
}

export const broadcastCapabilities = {
  canSend: true,
  reason: 'Announcements are queued through guarded super-admin operations.',
};

export type BroadcastResult = { id: string; status: string; queuedDeliveries: number };

export async function sendBroadcast(draft: BroadcastDraft): Promise<BroadcastResult> {
  const { data: id, error: createError } = await supabase.rpc('create_ops_broadcast', {
    p_title: draft.title.trim(), p_body: draft.message.trim(), p_audience: draft.audience, p_scheduled_at: null,
  });
  if (createError) throw createError;
  const { data, error: publishError } = await supabase.rpc('publish_ops_broadcast', { p_broadcast_id: id });
  if (publishError) throw publishError;
  const result = data as { id?: string; status?: string; queued_deliveries?: number };
  return { id: result.id ?? String(id), status: result.status ?? 'published', queuedDeliveries: result.queued_deliveries ?? 0 };
}
