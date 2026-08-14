import {
  clearCurrentMood,
  getCurrentMood,
  getMoodRemainingMs,
  saveCurrentMood,
} from '../services/localMood';
import type { MoodWheelOption } from '../constants/moodWheelOptions';
import {
  DEFAULT_MOOD_WHEEL_OPTIONS,
  MOOD_WHEEL_OPTIONS,
} from '../constants/moodWheelOptions';

type WheelOption = (typeof MOOD_WHEEL_OPTIONS)[number];

export type MoodWheelState = {
  enabledOptions: MoodWheelOption[];
  currentMood: MoodWheelOption | null;
  selectedIndex: number;
  spinning: boolean;
  remainingMs: number | null;
};

export function createMoodWheelState(): MoodWheelState {
  return {
    enabledOptions: DEFAULT_MOOD_WHEEL_OPTIONS,
    currentMood: getCurrentMood(),
    selectedIndex: 0,
    spinning: false,
    remainingMs: getMoodRemainingMs(),
  };
}

export function formatRemaining(ms: number | null): string {
  if (ms == null) return '';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `Active for ~${hours}h ${minutes}m more`;
  if (minutes > 0) return `Active for ~${minutes}m more`;
  return 'Expiring soon';
}

export function getVisibleOptions(enabled: MoodWheelOption[]): WheelOption[] {
  return MOOD_WHEEL_OPTIONS.filter(option => enabled.includes(option.value));
}

export function confirmMoodSelection(
  option: WheelOption | undefined,
): MoodWheelOption | null {
  if (!option) return null;
  saveCurrentMood(option.value);
  return option.value;
}

export function resetMood(): { currentMood: null; remainingMs: null } {
  clearCurrentMood();
  return { currentMood: null, remainingMs: null };
}
