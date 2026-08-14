// src/features/profile/types/profile.types.ts
export type GenderOption = 'man' | 'woman' | 'non_binary';

export interface Profile {
  id?: string;
  display_name?: string;
  bio?: string;
  city?: string;
  country?: string;
  region?: string;
  latitude?: number | null;
  longitude?: number | null;
  location_place_id?: number | null;
  location_updated_at?: string | null;
  birthdate?: string;
  gender?: GenderOption | null;
  interested_in?: GenderOption[];
  relationship_intention?: string;
  conversation_preferences?: string[];
  avatar_url?: string;
}
