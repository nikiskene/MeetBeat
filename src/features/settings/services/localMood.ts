import type { MoodWheelOption } from '../constants/moodWheelOptions';

const STORAGE_KEY = 'beat.daily-mood';
const MOOD_LIFETIME_MS = 24 * 60 * 60 * 1000;

type StoredMood = {
  value: MoodWheelOption;
  selectedAt: number;
};

export function getCurrentMood(): MoodWheelOption | null {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return null;
    const storedMood = JSON.parse(rawValue) as StoredMood;
    const hasExpired = Date.now() - storedMood.selectedAt >= MOOD_LIFETIME_MS;
    if (hasExpired) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return storedMood.value;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function getMoodSelectedAt(): number | null {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return null;
    const storedMood = JSON.parse(rawValue) as StoredMood;
    const hasExpired = Date.now() - storedMood.selectedAt >= MOOD_LIFETIME_MS;
    if (hasExpired) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return storedMood.selectedAt;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function getMoodExpiresAt(): number | null {
  const selectedAt = getMoodSelectedAt();
  return selectedAt != null ? selectedAt + MOOD_LIFETIME_MS : null;
}

export function getMoodRemainingMs(): number | null {
  const expiresAt = getMoodExpiresAt();
  if (expiresAt == null) return null;
  return Math.max(0, expiresAt - Date.now());
}

export function saveCurrentMood(value: MoodWheelOption): void {
  const storedMood: StoredMood = { value, selectedAt: Date.now() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedMood));
}

export function clearCurrentMood(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export const MOOD_LIFETIME_HOURS = MOOD_LIFETIME_MS / (60 * 60 * 1000);
