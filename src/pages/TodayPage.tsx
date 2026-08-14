import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RetryError from '../shared/components/RetryError';
import ExplorePage from '../features/discovery/pages/ExplorePage';
import { ActiveMood } from '../features/settings/components/ActiveMood';
import { MoodMachine } from '../features/settings/components/MoodMachine';
import { MoodWheelDisabled, MoodWheelLoading } from '../features/settings/components/MoodWheelStates';
import {
  MOOD_WHEEL_OPTIONS,
  normalizeMoodWheelOptions,
  type MoodWheelOption,
} from '../features/settings/constants/moodWheelOptions';
import {
  fetchActiveBeat,
  formatActiveBeatRemaining,
  getCachedActiveBeat,
  selectActiveBeat,
  type ActiveBeat,
} from '../features/settings/services/activeBeat';
import { fetchDiscoverySettings } from '../features/settings/services/discoverySettings';
import { useCmsGroup, pick } from '../features/cms/hooks/useCmsGroup';

const FALLBACK = {
  question: 'What would feel good today?',
  confirm: 'Choose this BEAT',
  random: 'Surprise me',
  instruction: 'Spin, scroll or use the arrows to explore.',
};

type Props = { onOpenConversation: (matchedUserId: string) => void };

export default function TodayPage({ onOpenConversation }: Props) {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState<MoodWheelOption[]>(
    MOOD_WHEEL_OPTIONS.map(option => option.value),
  );
  const [active, setActive] = useState<ActiveBeat | null>(() => getCachedActiveBeat());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const { content } = useCmsGroup('wheel');

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    Promise.all([fetchActiveBeat(user.id), fetchDiscoverySettings(user.id)])
      .then(([beat, settings]) => {
        if (!mounted) return;
        setActive(beat);
        setEnabled(normalizeMoodWheelOptions(settings.mood_wheel_options));
      })
      .catch(reason => {
        if (mounted) setError(reason instanceof Error ? reason.message : 'Your current BEAT could not be loaded.');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [retryKey, user]);

  const options = useMemo(
    () => MOOD_WHEEL_OPTIONS.filter(option => enabled.includes(option.value)),
    [enabled],
  );
  const selected = options[selectedIndex] ?? options[0];
  const activeOption = MOOD_WHEEL_OPTIONS.find(option => option.value === active?.beat);
  const showWheel = !active || editing;

  function move(direction: number) {
    if (spinning || options.length === 0) return;
    setSelectedIndex(index => (index + direction + options.length) % options.length);
  }

  function randomRoll() {
    if (spinning || options.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSelectedIndex(Math.floor(Math.random() * options.length));
      return;
    }
    setSpinning(true);
    const destination = Math.floor(Math.random() * options.length);
    let step = 0;
    const advance = () => {
      setSelectedIndex(index => (index + 1) % options.length);
      step += 1;
      if (step >= 12) {
        setSelectedIndex(destination);
        setSpinning(false);
      } else window.setTimeout(advance, 55);
    };
    advance();
  }

  async function confirm() {
    if (!user || !selected || spinning) return;
    setSaving(true);
    setError('');
    try {
      setActive(await selectActiveBeat(user.id, selected.value));
      setEditing(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your BEAT was not saved.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <MoodWheelLoading />;

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 md:px-10">
      <header className="mb-8">
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.22em] text-[#b07d6c]">Today</p>
        <h1 className="text-3xl font-light text-[#141414]">
          {showWheel ? pick(content, 'wheel.question', FALLBACK.question) : 'People on your wavelength'}
        </h1>
        {showWheel && <p className="mt-3 text-sm text-[#333333]/55">{pick(content, 'wheel.instruction', FALLBACK.instruction)}</p>}
      </header>

      {error && <RetryError message={error} onRetry={() => setRetryKey(key => key + 1)} />}
      {!error && options.length === 0 && <MoodWheelDisabled />}
      {!error && showWheel && selected && (
        <MoodMachine
          label={selected.label}
          answer={selected.answer}
          description={selected.description}
          spinning={spinning || saving}
          onPrevious={() => move(-1)}
          onNext={() => move(1)}
          onWheel={event => { event.preventDefault(); move(event.deltaY > 0 ? 1 : -1); }}
          onRandom={randomRoll}
          onConfirm={() => void confirm()}
          confirmLabel={saving ? 'Saving…' : pick(content, 'wheel.confirm', FALLBACK.confirm)}
          randomLabel={pick(content, 'wheel.random', FALLBACK.random)}
          instructionLabel={pick(content, 'wheel.instruction', FALLBACK.instruction)}
        />
      )}

      {!error && !showWheel && active && activeOption && (
        <>
          <ActiveMood
            label={activeOption.label}
            description={activeOption.description}
            remainingLabel={formatActiveBeatRemaining(active.expires_at)}
            onEdit={() => {
              const index = options.findIndex(option => option.value === active.beat);
              setSelectedIndex(index >= 0 ? index : 0);
              setEditing(true);
            }}
          />
          <section className="mt-12 border-t border-[#e8e0d0] pt-10">
            <ExplorePage
              beat={activeOption}
              onChangeBeat={() => setEditing(true)}
              onMatch={onOpenConversation}
              embedded
            />
          </section>
        </>
      )}
    </div>
  );
}
