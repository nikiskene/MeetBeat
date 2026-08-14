import { supabase } from '../../../lib/supabase';
import type { Profile } from '../../profile/types/profile.types';
import type { DiscoverySettings } from '../../settings/types/settings.types';
import {
  DEFAULT_MOOD_WHEEL_OPTIONS,
  type MoodWheelOption,
} from '../../settings/constants/moodWheelOptions';

export type OnboardingProfile = Profile & {
  interested_in?: string[];
  mood_wheel_options?: string[];
};

export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  const hasName = Boolean(profile.display_name?.trim());
  const hasBirthdate = Boolean(profile.birthdate);
  const hasGender = profile.gender !== undefined && profile.gender !== null;
  const hasLocation =
    Boolean(profile.city) &&
    profile.latitude != null &&
    profile.longitude != null;
  return hasName && hasBirthdate && hasGender && hasLocation;
}

export async function fetchOnboardingProfile(
  userId: string,
): Promise<OnboardingProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data as OnboardingProfile | null) ?? null;
}

export async function saveOnboardingProfile(
  userId: string,
  profile: OnboardingProfile,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ ...profile, id: userId });
  if (error) throw error;
}

export async function fetchOnboardingDiscovery(
  userId: string,
): Promise<DiscoverySettings> {
  const { data, error } = await supabase
    .from('discovery_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return {
    user_id: userId,
    interested_in: data?.interested_in ?? [],
    min_age: data?.min_age ?? 25,
    max_age: data?.max_age ?? 55,
    max_distance_km: data?.max_distance_km ?? 50,
    mood_wheel_options: DEFAULT_MOOD_WHEEL_OPTIONS,
  };
}

export async function saveOnboardingDiscovery(
  settings: DiscoverySettings,
): Promise<void> {
  const { error } = await supabase.from('discovery_settings').upsert({
    user_id: settings.user_id,
    interested_in: settings.interested_in,
    min_age: settings.min_age,
    max_age: settings.max_age,
    max_distance_km: settings.max_distance_km,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function saveMoodWheelOptions(
  userId: string,
  options: MoodWheelOption[],
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ mood_wheel_options: options })
    .eq('id', userId);
  if (error) throw error;
}
