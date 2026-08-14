import { supabase } from '../../../lib/supabase';
import { BLACK_LOGO, WHITE_LOGO } from '../../landing/constants/landingAssets';

export type DesignSetting = { key: string; value: unknown; updatedAt: string };
export type FeatureFlag = { id: string; name: string; description: string; enabled: boolean; updatedAt: string };
export type DesignSnapshot = {
  heroImages: string[];
  logos: Array<{ name: string; url: string; surface: string }>;
  settings: DesignSetting[];
  featureFlags: FeatureFlag[];
  settingsUnavailableReason: string | null;
};

type SlideRow = { image_url: string; position: number };
type SettingRow = { key: string; value: unknown; updated_at: string };
type FlagRow = { id: string; name: string; description: string | null; enabled: boolean; updated_at: string };

export async function fetchDesignSnapshot(): Promise<DesignSnapshot> {
  const [slidesResult, settingsResult, flagsResult] = await Promise.all([
    supabase.from('homepage_slides').select('image_url, position').order('position'),
    supabase.from('ops_settings').select('key, value, updated_at').order('key'),
    supabase.from('feature_flags').select('id, name, description, enabled, updated_at').order('name'),
  ]);
  const error = slidesResult.error ?? settingsResult.error ?? flagsResult.error;
  if (error) throw error;
  return {
    heroImages: ((slidesResult.data ?? []) as SlideRow[]).map(slide => slide.image_url),
    logos: [
      { name: 'White logo', url: WHITE_LOGO, surface: 'Dark surfaces and authentication' },
      { name: 'Black logo', url: BLACK_LOGO, surface: 'Light surfaces and landing footer' },
    ],
    settings: ((settingsResult.data ?? []) as SettingRow[]).map(setting => ({ key: setting.key, value: setting.value, updatedAt: setting.updated_at })),
    featureFlags: ((flagsResult.data ?? []) as FlagRow[]).map(flag => ({ id: flag.id, name: flag.name, description: flag.description ?? '', enabled: flag.enabled, updatedAt: flag.updated_at })),
    settingsUnavailableReason: null,
  };
}

export async function saveHomepageSlides(heroImages: string[]) {
  const slides = heroImages.map((imageUrl, position) => ({ image_url: imageUrl, alt_text: `BEAT homepage image ${position + 1}`, position, visible: true, published: true }));
  const { data, error } = await supabase.rpc('replace_homepage_slides', { p_slides: slides });
  if (error) throw error;
  return data;
}

export async function saveDesignSetting(key: string, value: unknown) {
  const { data, error } = await supabase.rpc('set_existing_ops_setting', { p_key: key, p_value: value });
  if (error) throw error;
  return data;
}

export async function saveFeatureFlag(name: string, description: string, enabled: boolean) {
  const { data, error } = await supabase.rpc('upsert_feature_flag', { p_name: name, p_description: description, p_enabled: enabled });
  if (error) throw error;
  return data as { id: string; name: string; description: string; enabled: boolean; updated_at: string };
}
