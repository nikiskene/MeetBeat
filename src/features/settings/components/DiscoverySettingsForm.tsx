// src/features/settings/components/DiscoverySettingsForm.tsx

import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Pill from '../../../shared/components/Pill';
import TextInput from '../../../shared/components/TextInput';
import { MOOD_WHEEL_OPTIONS } from '../constants/moodWheelOptions';
import type { DiscoverySettings } from '../types/settings.types';

const INTEREST_OPTIONS = ['Women', 'Men', 'Non-binary people'];

type Props = {
  settings: DiscoverySettings;
  saving: boolean;
  saved: boolean;
  onChange: (settings: DiscoverySettings) => void;
  onSave: () => void;
};

export function DiscoverySettingsForm({
  settings,
  saving,
  saved,
  onChange,
  onSave,
}: Props) {
  const toggleInterest = (value: string) => {
    const current = settings.interested_in ?? [];

    onChange({
      ...settings,
      interested_in: current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value],
    });
  };

  const toggleMoodOption = (
    value: DiscoverySettings['mood_wheel_options'][number]
  ) => {
    const current = settings.mood_wheel_options;

    onChange({
      ...settings,
      mood_wheel_options: current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value],
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-sm font-medium text-[#141414]">
          Who do you want to meet?
        </h2>

        <div className="flex flex-wrap gap-2 mt-4">
          {INTEREST_OPTIONS.map(option => (
            <Pill
              key={option}
              active={settings.interested_in.includes(option)}
              onClick={() => toggleInterest(option)}
            >
              {option}
            </Pill>
          ))}
        </div>
      </Card>

      <Card className="grid grid-cols-2 gap-4">
        <TextInput
          label="Min age"
          type="number"
          value={settings.min_age}
          min={18}
          max={99}
          onChange={event =>
            onChange({
              ...settings,
              min_age: Number(event.target.value),
            })
          }
        />

        <TextInput
          label="Max age"
          type="number"
          value={settings.max_age}
          min={18}
          max={99}
          onChange={event =>
            onChange({
              ...settings,
              max_age: Number(event.target.value),
            })
          }
        />
      </Card>

      <Card>
        <label className="block text-sm font-medium text-[#141414]">
          Distance: {settings.max_distance_km} km
        </label>

        <input
          type="range"
          min={5}
          max={250}
          step={5}
          value={settings.max_distance_km}
          onChange={event =>
            onChange({
              ...settings,
              max_distance_km: Number(event.target.value),
            })
          }
          className="w-full mt-4"
        />
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-[#141414]">
          Daily mood wheel
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-[#333333]/60">
          Choose which intentions may appear on your daily mood wheel.
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          {MOOD_WHEEL_OPTIONS.map(option => (
            <Pill
              key={option.value}
              active={settings.mood_wheel_options.includes(option.value)}
              onClick={() => toggleMoodOption(option.value)}
            >
              {option.label}
            </Pill>
          ))}
        </div>
      </Card>

      <Button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="w-full"
      >
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save settings'}
      </Button>
    </div>
  );
}