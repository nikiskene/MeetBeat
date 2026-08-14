// src/features/admin/services/systemHealth.ts

import { supabase } from '../../../lib/supabase';

export type HealthStatus = 'green' | 'orange' | 'red';

export type HealthSnapshotEntry = {
  status: HealthStatus;
  feature: string;
  message: string;
  checked_at: string;
};

export async function fetchSystemHealth(): Promise<HealthSnapshotEntry[]> {
  const { data, error } = await supabase.rpc('get_beat_health_snapshot');

  if (error) throw error;

  if (!Array.isArray(data)) return [];

  return data as HealthSnapshotEntry[];
}
