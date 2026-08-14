export type OnboardingStepId =
  | 'welcome'
  | 'identity'
  | 'name'
  | 'location'
  | 'bio'
  | 'photo'
  | 'done';

export const ONBOARDING_STEPS: { id: OnboardingStepId; label: string }[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'identity', label: 'About you' },
  { id: 'name', label: 'Your name' },
  { id: 'location', label: 'Location' },
  { id: 'bio', label: 'Your bio' },
  { id: 'photo', label: 'Photo' },
  { id: 'done', label: 'Ready' },
];

export const ONBOARDING_COPY = {
  welcome: {
    eyebrow: 'Welcome to BEAT',
    title: 'Dating starts with the right mood.',
    body: 'BEAT helps you say what you feel like today and discover people whose mood, intention, and energy align. You can browse freely and like as many people as you want.',
    cta: 'Get started',
  },
  identity: {
    eyebrow: 'About you',
    title: 'Who you are and who you’d like to meet',
    body: 'These help BEAT show you relevant people. You can change them anytime in Settings.',
  },
  name: {
    eyebrow: 'Your name',
    title: 'What should people call you?',
    body: 'This appears on your profile. Use a first name or a nickname — whatever feels right.',
  },
  location: {
    eyebrow: 'Your location',
    title: 'Where are you?',
    body: 'BEAT uses your city to find people nearby. Your exact coordinates are never shown.',
  },
  bio: {
    eyebrow: 'Your bio',
    title: 'Tell people who you really are',
    body: 'Share your values, curiosities, or what lights you up. A real opener makes starting a conversation easier.',
  },
  photo: {
    eyebrow: 'Your photo',
    title: 'Add a photo',
    body: 'A photo helps people feel comfortable starting a conversation. You can skip this and add one later.',
    skip: 'Skip for now',
  },
  discovery: {
    eyebrow: 'Discovery preferences',
    title: 'Who should BEAT introduce you to?',
    body: 'Set your age range, distance, and who you want to meet. You can adjust these anytime.',
  },
  mood: {
    eyebrow: 'Your first BEAT',
    title: 'What would feel good today?',
    body: 'Choose your mood and BEAT will find people on the same wavelength. You can change it anytime — it resets after 24 hours.',
  },
  done: {
    eyebrow: 'Profile complete',
    title: 'Now let’s understand how you connect.',
    body: 'Your connection interview is next. Ten quick questions help BEAT rank people who may feel more natural to meet.',
    explore: 'Start connection interview',
    profile: 'Edit my profile',
  },
} as const;
