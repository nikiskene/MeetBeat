// src/features/settings/services/discoverySettings.ts

import { supabase } from '../../../lib/supabase';
import {
  normalizeMoodWheelOptions,
  type MoodWheelOption,
} from '../constants/moodWheelOptions';
import type { DiscoverySettings } from '../types/settings.types';

const DEFAULT_SETTINGS = {
  interested_in: [],
  min_age: 25,
  max_age: 55,
  max_distance_km: 50,
};

function normalizeInterests(values?: string[] | null): string[] {
  const aliases: Record<string, string> = {
    woman: 'woman', women: 'woman', man: 'man', men: 'man',
    non_binary: 'non_binary', nonbinary: 'non_binary',
    'non-binary people': 'non_binary',
  };
  return Array.from(new Set((values ?? []).map(value => aliases[value.toLowerCase()]).filter(Boolean)));
}

export async function fetchDiscoverySettings(
  userId: string
): Promise<DiscoverySettings> {
  const [discoveryResult, profileResult] = await Promise.all([
    supabase
      .from('discovery_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),

    supabase
      .from('profiles')
      .select('mood_wheel_options')
      .eq('id', userId)
      .maybeSingle(),
  ]);

  if (discoveryResult.error) throw discoveryResult.error;
  if (profileResult.error) throw profileResult.error;

  const discovery = discoveryResult.data;
  const profile = profileResult.data;

  return {
    user_id: userId,
    interested_in: normalizeInterests(discovery?.interested_in ?? DEFAULT_SETTINGS.interested_in),
    min_age: discovery?.min_age ?? DEFAULT_SETTINGS.min_age,
    max_age: discovery?.max_age ?? DEFAULT_SETTINGS.max_age,
    max_distance_km:
      discovery?.max_distance_km ?? DEFAULT_SETTINGS.max_distance_km,
    mood_wheel_options: normalizeMoodWheelOptions(
      profile?.mood_wheel_options as MoodWheelOption[] | null,
    ),
    updated_at: discovery?.updated_at,
  };
}

export async function saveDiscoverySettings(
  settings: DiscoverySettings
): Promise<void> {
  const {
    mood_wheel_options,
    user_id,
    interested_in,
    min_age,
    max_age,
    max_distance_km,
  } = settings;

  const [discoveryResult, profileResult] = await Promise.all([
    supabase.from('discovery_settings').upsert({
      user_id,
      interested_in,
      min_age,
      max_age,
      max_distance_km,
      updated_at: new Date().toISOString(),
    }),

    supabase
      .from('profiles')
      .update({
        mood_wheel_options,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id),
  ]);

  if (discoveryResult.error) throw discoveryResult.error;
  if (profileResult.error) throw profileResult.error;
}
