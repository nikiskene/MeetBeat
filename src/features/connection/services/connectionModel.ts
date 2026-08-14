import type {
  ConnectionDimension,
  ConnectionProfile,
  ConnectionQuestion,
} from '../types/connection.types';

const question = (
  id: string,
  dimension: ConnectionDimension,
  text: string,
  a: string,
  b: string,
  c: string,
): ConnectionQuestion => ({
  id, dimension, text,
  answers: [
    { id: 'a', text: a, score: 0 },
    { id: 'b', text: b, score: 1 },
    { id: 'c', text: c, score: 2 },
  ],
});

export const CONNECTION_QUESTIONS: ConnectionQuestion[] = [
  question('q1', 'depth', 'You meet someone interesting. What usually pulls you in?', 'A playful spark', 'An easy conversation', 'Going somewhere deeper'),
  question('q2', 'depth', 'A conversation feels especially good when…', 'It stays light and fun', 'It moves naturally between topics', 'We forget time exists'),
  question('q3', 'directness', 'When you like someone, you tend to…', 'Let them figure it out', 'Give them a few signs', 'Tell them clearly'),
  question('q4', 'directness', 'When something feels unclear, you prefer to…', 'See how it develops', 'Wait for the right moment', 'Ask directly'),
  question('q5', 'focus', 'Your ideal first meeting is…', 'Somewhere lively', 'Relaxed with some atmosphere', 'Quiet enough to focus on each other'),
  question('q6', 'focus', 'At a social gathering, you usually…', 'Move between many people', 'Mix, then settle into a conversation', 'Find one person worth talking to'),
  question('q7', 'structure', 'A spontaneous invitation arrives. Your first reaction is…', 'Let’s go', 'Tell me a little more', 'I would rather make a plan'),
  question('q8', 'structure', 'A good date feels best when…', 'Anything could happen', 'There is a loose idea', 'We know what we are doing'),
  question('q9', 'pace', 'When a connection begins, you usually…', 'Follow the chemistry quickly', 'Let it unfold naturally', 'Need time before opening up'),
  question('q10', 'pace', 'After a promising first date, you prefer…', 'Keep the momentum going', 'Stay in touch and see', 'Have some time to process'),
];

const order: ConnectionDimension[] = ['depth', 'directness', 'focus', 'structure', 'pace'];
const summaries: Record<string, string> = {
  Playful: 'You tend to connect through lightness, chemistry and shared humour.',
  Balanced: 'You enjoy conversations that can move naturally between light and meaningful.',
  Deep: 'You tend to enjoy conversations that move beyond the surface.',
  Subtle: 'You often prefer connection to reveal itself gradually.',
  Responsive: 'You communicate through a balance of signals and clear responses.',
  Direct: 'You appreciate clear communication and knowing where you stand.',
  Social: 'You often feel energised by lively environments and varied interaction.',
  Flexible: 'You can enjoy both social energy and focused one-to-one time.',
  'One-to-one': 'You often feel most comfortable focusing on one person at a time.',
  Spontaneous: 'You enjoy leaving room for surprise and following the moment.',
  Adaptable: 'You like having a direction without planning every detail.',
  Planned: 'You tend to feel best when expectations and plans are clear.',
  'Fast-opening': 'You are comfortable following momentum when the chemistry feels right.',
  'Natural pace': 'You prefer to let a new connection unfold without forcing its pace.',
  'Slow-opening': 'You usually need some time before fully opening up.',
};

function label(dimension: ConnectionDimension, score: number): string {
  const low = score <= 1;
  const middle = score === 2;
  if (dimension === 'depth') return low ? 'Playful' : middle ? 'Balanced' : 'Deep';
  if (dimension === 'directness') return low ? 'Subtle' : middle ? 'Responsive' : 'Direct';
  if (dimension === 'focus') return low ? 'Social' : middle ? 'Flexible' : 'One-to-one';
  if (dimension === 'structure') return low ? 'Spontaneous' : middle ? 'Adaptable' : 'Planned';
  return low ? 'Fast-opening' : middle ? 'Natural pace' : 'Slow-opening';
}

export function calculateConnectionProfile(answers: Record<string, string>): ConnectionProfile {
  if (CONNECTION_QUESTIONS.some(item => !item.answers.some(answer => answer.id === answers[item.id]))) {
    throw new Error('Please answer all ten questions.');
  }
  const dimensions = Object.fromEntries(order.map(item => [item, 0])) as Record<ConnectionDimension, number>;
  CONNECTION_QUESTIONS.forEach(item => {
    dimensions[item.dimension] += item.answers.find(answer => answer.id === answers[item.id])?.score ?? 0;
  });
  const labels = Object.fromEntries(order.map(item => [item, label(item, dimensions[item])])) as Record<ConnectionDimension, string>;
  return { version: 1, dimensions, labels, identifier: order.map(item => labels[item]).join(' · ') };
}

export function connectionSummary(profile: ConnectionProfile): string {
  return order.map(item => summaries[profile.labels[item]]).filter(Boolean).join(' ');
}
