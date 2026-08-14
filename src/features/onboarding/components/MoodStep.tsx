import { useState } from 'react';
import { MoodMachine } from '../../settings/components/MoodMachine';
import {
  DEFAULT_MOOD_WHEEL_OPTIONS,
  MOOD_WHEEL_OPTIONS,
  type MoodWheelOption,
} from '../../settings/constants/moodWheelOptions';
import { saveCurrentMood } from '../../settings/services/localMood';
import { ONBOARDING_COPY } from '../constants/onboardingContent';
import { StepShell } from './StepShell';

type Props = {
  enabledOptions: MoodWheelOption[];
  onNext: () => void;
  onBack: () => void;
};

export function MoodStep({ enabledOptions, onNext, onBack }: Props) {
  const copy = ONBOARDING_COPY.mood;
  const options = MOOD_WHEEL_OPTIONS.filter(option =>
    enabledOptions.includes(option.value),
  );
  const safeOptions = options.length > 0 ? options : DEFAULT_MOOD_WHEEL_OPTIONS.map(v =>
    MOOD_WHEEL_OPTIONS.find(o => o.value === v)!,
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);

  function moveSelection(direction: number) {
    if (spinning || safeOptions.length === 0) return;
    setSelectedIndex(current => {
      const next = current + direction;
      return (next + safeOptions.length) % safeOptions.length;
    });
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    moveSelection(event.deltaY > 0 ? 1 : -1);
  }

  function randomRoll() {
    if (spinning || safeOptions.length < 2) return;
    setSpinning(true);
    const finalIndex = Math.floor(Math.random() * safeOptions.length);
    const steps = 16 + Math.floor(Math.random() * 8);
    let step = 0;
    function advance() {
      setSelectedIndex(current => (current + 1) % safeOptions.length);
      step += 1;
      if (step >= steps) {
        setSelectedIndex(finalIndex);
        setSpinning(false);
        return;
      }
      window.setTimeout(advance, 55 + step * 9);
    }
    advance();
  }

  function confirmSelection() {
    const selected = safeOptions[selectedIndex];
    if (!selected || spinning) return;
    saveCurrentMood(selected.value);
    onNext();
  }

  return (
    <StepShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      body={copy.body}
      onBack={onBack}
      onNext={confirmSelection}
      canProceed={!spinning}
      nextLabel="Choose this BEAT"
    >
      <MoodMachine
        label={safeOptions[selectedIndex]?.label ?? ''}
        spinning={spinning}
        onPrevious={() => moveSelection(-1)}
        onNext={() => moveSelection(1)}
        onWheel={handleWheel}
        onRandom={randomRoll}
        onConfirm={confirmSelection}
      />
    </StepShell>
  );
}
