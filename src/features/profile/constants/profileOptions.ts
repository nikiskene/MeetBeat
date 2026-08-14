// src/features/profile/constants/profileOptions.ts
import type { GenderOption } from '../types/profile.types';

export const GENDER_OPTIONS: {
  value: GenderOption;
  label: string;
}[] = [
  { value: 'man', label: 'Man' },
  { value: 'woman', label: 'Woman' },
  { value: 'non_binary', label: 'Non-binary' },
];

export const INTENTION_OPTIONS = [
  'Long-term relationship',
  'Casual dating',
  'New friends',
  'Something undefined',
  'Open to anything',
];

export const CONVERSATION_PREFS = [
  'Deep philosophical talks',
  'Humor and banter',
  'Life experiences',
  'Books and ideas',
  'Creative projects',
  'Current events',
  'Food and travel',
  'Music and art',
];