// src/features/settings/types/settings.types.ts

import type { MoodWheelOption } from '../constants/moodWheelOptions';

export type DiscoverySettings = {
  user_id: string;

  interested_in: string[];

  min_age: number;
  max_age: number;
  max_distance_km: number;

  mood_wheel_options: MoodWheelOption[];

  updated_at?: string;
};