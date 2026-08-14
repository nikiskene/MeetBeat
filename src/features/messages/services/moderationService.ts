// src/features/messages/services/moderationService.ts

import { supabase } from '../../../lib/supabase';

export async function blockUser(
  targetUserId: string
) {
  const { error } = await supabase.rpc(
    'block_user',
    {
      p_target_user_id: targetUserId,
    }
  );

  if (error) throw error;
}

export async function unmatchUser(
  matchId: string
) {
  const { error } = await supabase.rpc(
    'unmatch_users',
    {
      p_match_id: matchId,
    }
  );

  if (error) throw error;
}

export async function reportUser(
  matchId: string,
  reason: string,
  details?: string
) {
  const { error } = await supabase.rpc(
    'report_match_user',
    {
      p_match_id: matchId,
      p_reason: reason,
      p_details: details ?? null,
    }
  );

  if (error) throw error;
}