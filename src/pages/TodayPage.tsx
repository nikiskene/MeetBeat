import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import RetryError from '../shared/components/RetryError';
import ExplorePage from '../features/discovery/pages/ExplorePage';
import { ActiveMood } from '../features/settings/components/ActiveMood';
import { MoodMachine } from '../features/settings/components/MoodMachine';
import { MoodWheelDisabled, MoodWheelLoading } from '../features/settings/components/MoodWheelStates';
import {
  DEFAULT_MOOD_WHEEL_OPTIONS,
  MOOD_WHEEL_OPTIONS,
  type MoodWheelOption,
} from '../features/settings/constants/moodWheelOptions';
import { getCurrentMood, getMoodRemainingMs } from '../features/settings/services/localMood';
import { useCmsGroup, pick } from '../features/cms/hooks/useCmsGroup';
import { confirmMoodSelection, formatRemaining, getVisibleOptions, resetMood } from '../features/settings/utils/moodWheelHelpers';

const WHEEL_FALLBACK: Record<string, string> = {
  'wheel.question': 'What would feel good today?',
  'wheel.confirm': 'Choose this beat',
  'wheel.random': 'Surprise me',
  'wheel.instruction': 'Scroll, use the arrows, or let chance choose.',
};

type TodayPageProps = { onOpenConversation: (matchedUserId: string) => void };

export default function TodayPage({ onOpenConversation }: TodayPageProps) {
  const { user } = useAuth();
  const [enabledOptions, setEnabledOptions] = useState<MoodWheelOption[]>(DEFAULT_MOOD_WHEEL_OPTIONS);
  const [currentMood, setCurrentMood] = useState<MoodWheelOption | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const { content } = useCmsGroup('wheel');

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    async function load() {
      try {
        setLoading(true);
        setError('');
        setCurrentMood(getCurrentMood());
        setRemainingMs(getMoodRemainingMs());
        const { data, error: loadError } = await supabase
          .from('profiles')
          .select('mood_wheel_options')
          .eq('id', userId)
          .maybeSingle();
        if (loadError) throw loadError;
        setEnabledOptions(
          (data?.mood_wheel_options as MoodWheelOption[] | null) ??
            DEFAULT_MOOD_WHEEL_OPTIONS,
        );
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Your daily beat could not be loaded.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [retryKey, user]);

  const visibleOptions = useMemo(() => getVisibleOptions(enabledOptions), [enabledOptions]);
  const selectedOption = visibleOptions[selectedIndex];

  function moveSelection(direction: number) {
    if (spinning || visibleOptions.length === 0) return;
    setSelectedIndex(c => (c + direction + visibleOptions.length) % visibleOptions.length);
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    moveSelection(event.deltaY > 0 ? 1 : -1);
  }

  function confirmSelection() {
    const mood = confirmMoodSelection(selectedOption);
    if (mood) {
      setCurrentMood(mood);
      setRemainingMs(getMoodRemainingMs());
      setEditing(false);
    }
  }

  function handleReset() {
    const result = resetMood();
    setCurrentMood(result.currentMood);
    setRemainingMs(result.remainingMs);
    setEditing(false);
    setSelectedIndex(0);
  }

  function editMood() {
    const idx = visibleOptions.findIndex(o => o.value === currentMood);
    setSelectedIndex(idx >= 0 ? idx : 0);
    setEditing(true);
  }

  function randomRoll() {
    if (spinning || visibleOptions.length < 2) return;
    setSpinning(true);
    const finalIndex = Math.floor(Math.random() * visibleOptions.length);
    const steps = 16 + Math.floor(Math.random() * 8);
    let step = 0;
    function advance() {
      setSelectedIndex(c => (c + 1) % visibleOptions.length);
      step += 1;
      if (step >= steps) { setSelectedIndex(finalIndex); setSpinning(false); return; }
      window.setTimeout(advance, 55 + step * 9);
    }
    advance();
  }

  if (loading) return <MoodWheelLoading />;

  const activeOption = MOOD_WHEEL_OPTIONS.find(o => o.value === currentMood);
  const showMachine = !currentMood || editing;
  const questionLabel = pick(content, 'wheel.question', WHEEL_FALLBACK['wheel.question']);
  const confirmLabel = pick(content, 'wheel.confirm', WHEEL_FALLBACK['wheel.confirm']);
  const randomLabel = pick(content, 'wheel.random', WHEEL_FALLBACK['wheel.random']);
  const instructionLabel = pick(content, 'wheel.instruction', WHEEL_FALLBACK['wheel.instruction']);

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 md:px-12">
      <header className="mb-8">
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.22em] text-[#b07d6c]">Today</p>
        <h1 className="text-3xl font-light text-[#141414]">{showMachine ? questionLabel : 'Your daily beat'}</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#333333]/55">
          {showMachine ? instructionLabel : 'Your choice remains active on this device for 24 hours.'}
        </p>
      </header>

      {error && <RetryError message={error} onRetry={() => setRetryKey(k => k + 1)} />}

      {!error && visibleOptions.length === 0 && <MoodWheelDisabled />}

      {!error && showMachine && visibleOptions.length > 0 && (
        <MoodMachine
          label={selectedOption?.label ?? ''}
          spinning={spinning}
          onPrevious={() => moveSelection(-1)}
          onNext={() => moveSelection(1)}
          onWheel={handleWheel}
          onRandom={randomRoll}
          onConfirm={confirmSelection}
          confirmLabel={confirmLabel}
          randomLabel={randomLabel}
          instructionLabel={instructionLabel}
        />
      )}

      {!error && !showMachine && (
        <ActiveMood
          label={activeOption?.label ?? 'Today'}
          remainingLabel={formatRemaining(remainingMs)}
          onEdit={editMood}
          onReset={handleReset}
        />
      )}

      {!error && currentMood && !editing && (
        <section className="mt-12 border-t border-[#e8e0d0] pt-10">
          <ExplorePage onMatch={onOpenConversation} embedded />
        </section>
      )}
    </div>
  );
}
