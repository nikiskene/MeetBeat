// src/features/discovery/services/discovery.ts
import { supabase } from '../../../lib/supabase';

export type DiscoveryCandidate = {
  id: string;
  display_name: string;
  birthdate: string;
  gender: string;
  relationship_intention: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  location_label: string | null;
  avatar_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type DiscoveryDecision = 'like' | 'skip';

export type DiscoveryDecisionResult = {
  matchId: string | null;
  isMatch: boolean;
};

export async function fetchCandidates(): Promise<DiscoveryCandidate[]> {
  const { data, error } = await supabase.rpc('get_discovery_candidates_v2');

  if (error) throw error;

  return (data ?? []) as DiscoveryCandidate[];
}

export async function recordDiscoveryDecision(
  targetId: string,
  decision: DiscoveryDecision
): Promise<DiscoveryDecisionResult> {
  const { data, error } = await supabase.rpc('record_discovery_decision', {
    p_target_id: targetId,
    p_decision: decision,
  });

  if (error) throw error;

  const matchId = typeof data === 'string' ? data : null;

  return {
    matchId,
    isMatch: Boolean(matchId),
  };
}
