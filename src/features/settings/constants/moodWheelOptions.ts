// src/features/settings/constants/moodWheelOptions.ts

export const MOOD_WHEEL_OPTIONS = [
  {
    value: 'chat',
    label: 'Chat',
  },
  {
    value: 'meet',
    label: 'Meet',
  },
  {
    value: 'coffee',
    label: 'Coffee',
  },
  {
    value: 'flirt',
    label: 'Flirt',
  },
  {
    value: 'date',
    label: 'Date',
  },
  {
    value: 'something_unforgettable',
    label: 'Something unforgettable',
  },
  {
    value: 'lifetime',
    label: 'Lifetime',
  },
] as const;

export type MoodWheelOption =
  (typeof MOOD_WHEEL_OPTIONS)[number]['value'];

export const DEFAULT_MOOD_WHEEL_OPTIONS: MoodWheelOption[] =
  MOOD_WHEEL_OPTIONS.map(option => option.value);