export const MOOD_WHEEL_OPTIONS = [
  {
    value: 'deep_talk',
    label: 'Deep Talk',
    answer: 'Have a deep conversation',
    description: 'One of those conversations where we forget to check our phones.',
  },
  {
    value: 'coffee',
    label: 'Coffee',
    answer: 'Meet for a casual coffee',
    description: 'No pressure. No performance. Just see how it feels.',
  },
  {
    value: 'dreamy_walk',
    label: 'Dreamy Walk',
    answer: 'Take a dreamy walk',
    description: 'Walk side by side and let the conversation find its own direction.',
  },
  {
    value: 'quiet_time',
    label: 'Quiet Time',
    answer: 'Spend quiet time together',
    description: 'Comfortable company without needing to fill every silence.',
  },
  {
    value: 'laugh',
    label: 'Laugh',
    answer: 'Laugh out loud',
    description: 'Keep it light, playful and wonderfully unserious.',
  },
  {
    value: 'flirt',
    label: 'Flirt',
    answer: 'Flirt respectfully',
    description: 'A little chemistry, clear signals and good boundaries.',
  },
  {
    value: 'adventure',
    label: 'Adventure',
    answer: 'Have an adventurous day',
    description: 'Leave the routine behind and see where the day takes us.',
  },
  {
    value: 'create',
    label: 'Create',
    answer: 'Create something meaningful',
    description: 'Cook, draw, build, write or make something together.',
  },
  {
    value: 'museum',
    label: 'Museum',
    answer: 'Visit a museum or gallery',
    description: 'Discover something beautiful and have someone to talk about it with.',
  },
  {
    value: 'playlist',
    label: 'Playlist',
    answer: 'Share our playlists',
    description: 'Trade the songs that say more about us than a profile ever could.',
  },
  {
    value: 'philosophy',
    label: 'Philosophy',
    answer: 'Get lost in philosophy',
    description: 'Big questions, curious minds and no urgent need for final answers.',
  },
  {
    value: 'outside',
    label: 'Outside',
    answer: 'Get outside',
    description: 'Fresh air, open space and somewhere better than another screen.',
  },
  {
    value: 'unforgettable',
    label: 'Unforgettable',
    answer: 'Do something unforgettable',
    description: 'Create the kind of story we will still enjoy telling later.',
  },
] as const;

export type MoodWheelOption = (typeof MOOD_WHEEL_OPTIONS)[number]['value'];
export type MoodWheelItem = (typeof MOOD_WHEEL_OPTIONS)[number];

export const DEFAULT_MOOD_WHEEL_OPTIONS: MoodWheelOption[] =
  MOOD_WHEEL_OPTIONS.map(option => option.value);

export function isMoodWheelOption(value: string): value is MoodWheelOption {
  return MOOD_WHEEL_OPTIONS.some(option => option.value === value);
}

export function normalizeMoodWheelOptions(values?: string[] | null): MoodWheelOption[] {
  const valid = (values ?? []).filter(isMoodWheelOption);
  return valid.length > 0 ? Array.from(new Set(valid)) : DEFAULT_MOOD_WHEEL_OPTIONS;
}
