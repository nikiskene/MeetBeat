import { supabase } from '../../../lib/supabase';
import type { MoodWheelOption } from '../constants/moodWheelOptions';
import { isMoodWheelOption } from '../constants/moodWheelOptions';

const CACHE_KEY = 'beat.activeBeat';
const ACTIVE_DURATION_MS = 24 * 60 * 60 * 1000;

export type ActiveBeat = {
  user_id: string;
  beat: MoodWheelOption;
  selected_at: string;
  expires_at: string;
};

function isActive(value: ActiveBeat): boolean {
  return isMoodWheelOption(value.beat) && new Date(value.expires_at).getTime() > Date.now();
}

function cache(value: ActiveBeat | null) {
  if (value && isActive(value)) {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } else {
    window.localStorage.removeItem(CACHE_KEY);
  }
}

export function getCachedActiveBeat(): ActiveBeat | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as ActiveBeat;
    if (!isActive(value)) {
      cache(null);
      return null;
    }
    return value;
  } catch {
    cache(null);
    return null;
  }
}

export async function fetchActiveBeat(userId: string): Promise<ActiveBeat | null> {
  const { data, error } = await supabase
    .from('active_beats')
    .select('user_id, beat, selected_at, expires_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  const value = data as ActiveBeat | null;
  if (!value || !isActive(value)) {
    cache(null);
    return null;
  }
  cache(value);
  return value;
}

export async function selectActiveBeat(
  userId: string,
  beat: MoodWheelOption,
): Promise<ActiveBeat> {
  const selectedAt = new Date();
  const value: ActiveBeat = {
    user_id: userId,
    beat,
    selected_at: selectedAt.toISOString(),
    expires_at: new Date(selectedAt.getTime() + ACTIVE_DURATION_MS).toISOString(),
  };
  const { data, error } = await supabase
    .from('active_beats')
    .upsert(value, { onConflict: 'user_id' })
    .select('user_id, beat, selected_at, expires_at')
    .single();
  if (error) throw error;
  const saved = data as ActiveBeat;
  cache(saved);
  return saved;
}

export function formatActiveBeatRemaining(expiresAt: string): string {
  const remaining = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`;
}
