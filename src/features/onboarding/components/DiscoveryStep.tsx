import type { DiscoverySettings } from '../../settings/types/settings.types';
import { ONBOARDING_COPY } from '../constants/onboardingContent';
import { StepShell } from './StepShell';

type Props = {
  settings: DiscoverySettings;
  onChange: (settings: DiscoverySettings) => void;
  onNext: () => void;
  onBack: () => void;
};

const INTEREST_OPTIONS = ['Women', 'Men', 'Non-binary people'];
const INTEREST_MAP: Record<string, string> = {
  'Women': 'woman',
  'Men': 'man',
  'Non-binary people': 'non_binary',
};

export function DiscoveryStep({ settings, onChange, onNext, onBack }: Props) {
  const copy = ONBOARDING_COPY.discovery;
  const canProceed = settings.interested_in.length > 0;

  function toggleInterest(label: string) {
    const value = INTEREST_MAP[label];
    const has = settings.interested_in.includes(value);
    onChange({
      ...settings,
      interested_in: has
        ? settings.interested_in.filter(item => item !== value)
        : [...settings.interested_in, value],
    });
  }

  return (
    <StepShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      body={copy.body}
      onBack={onBack}
      onNext={onNext}
      canProceed={canProceed}
    >
      <div className="space-y-8">
        <div>
          <label className="mb-3 block text-xs font-medium uppercase tracking-wider text-[#333333]/50">
            Who do you want to meet?
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(label => {
              const value = INTEREST_MAP[label];
              const active = settings.interested_in.includes(value);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleInterest(label)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-[#141414] text-white'
                      : 'border border-[#e8e0d0] text-[#333333] hover:bg-[#f2ede3]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ob-min-age" className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#333333]/50">
              Min age
            </label>
            <input
              id="ob-min-age"
              type="number"
              min={18}
              max={99}
              value={settings.min_age}
              onChange={e => onChange({ ...settings, min_age: Number(e.target.value) })}
              className="w-full rounded-xl border border-[#e8e0d0] bg-[#f9f6f0] px-4 py-3.5 text-sm text-[#141414] outline-none focus:border-[#b07d6c]"
            />
          </div>
          <div>
            <label htmlFor="ob-max-age" className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#333333]/50">
              Max age
            </label>
            <input
              id="ob-max-age"
              type="number"
              min={18}
              max={99}
              value={settings.max_age}
              onChange={e => onChange({ ...settings, max_age: Number(e.target.value) })}
              className="w-full rounded-xl border border-[#e8e0d0] bg-[#f9f6f0] px-4 py-3.5 text-sm text-[#141414] outline-none focus:border-[#b07d6c]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="ob-distance" className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#333333]/50">
            Distance: {settings.max_distance_km} km
          </label>
          <input
            id="ob-distance"
            type="range"
            min={5}
            max={250}
            step={5}
            value={settings.max_distance_km}
            onChange={e => onChange({ ...settings, max_distance_km: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
    </StepShell>
  );
}
