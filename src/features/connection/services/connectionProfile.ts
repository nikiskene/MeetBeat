import { supabase } from '../../../lib/supabase';
import { calculateConnectionProfile } from './connectionModel';
import type { StoredConnectionProfile } from '../types/connection.types';

const DRAFT_KEY = 'beat.connectionInterview.v1';

export async function fetchConnectionProfile(userId: string): Promise<StoredConnectionProfile | null> {
  const { data, error } = await supabase
    .from('connection_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as StoredConnectionProfile | null;
}

export async function saveConnectionProfile(
  userId: string,
  answers: Record<string, string>,
): Promise<StoredConnectionProfile> {
  const now = new Date().toISOString();
  const value: StoredConnectionProfile = {
    user_id: userId,
    questionnaire_version: 1,
    answers,
    profile: calculateConnectionProfile(answers),
    completed_at: now,
    updated_at: now,
  };
  const { data, error } = await supabase
    .from('connection_profiles')
    .upsert(value, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (error) throw error;
  clearConnectionDraft();
  return data as StoredConnectionProfile;
}

export function loadConnectionDraft(): Record<string, string> {
  try {
    return JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

export function saveConnectionDraft(answers: Record<string, string>) {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
}

export function clearConnectionDraft() {
  window.localStorage.removeItem(DRAFT_KEY);
}
