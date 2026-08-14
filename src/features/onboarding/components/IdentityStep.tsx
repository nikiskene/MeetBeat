import { GENDER_OPTIONS, INTENTION_OPTIONS } from '../../profile/constants/profileOptions';
import type { GenderOption } from '../../profile/types/profile.types';
import type { OnboardingProfile } from '../services/onboardingService';
import { ONBOARDING_COPY } from '../constants/onboardingContent';
import { StepShell } from './StepShell';

type Props = {
  profile: OnboardingProfile;
  onChange: (profile: OnboardingProfile) => void;
  onNext: () => void;
  onBack: () => void;
};

const INTEREST_MAP: Record<string, GenderOption> = {
  'Women': 'woman',
  'Men': 'man',
  'Non-binary people': 'non_binary',
};

export function IdentityStep({ profile, onChange, onNext, onBack }: Props) {
  const copy = ONBOARDING_COPY.identity;
  const interested = profile.interested_in ?? [];

  function toggleGender(value: GenderOption) {
    onChange({ ...profile, gender: value });
  }

  function toggleInterest(label: string) {
    const value = INTEREST_MAP[label];
    const current = (profile.interested_in ?? []) as GenderOption[];
    const has = current.includes(value);
    onChange({
      ...profile,
      interested_in: has
        ? current.filter(item => item !== value)
        : [...current, value],
    });
  }

  const canProceed = profile.gender != null && interested.length > 0;

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
            I am a
          </label>
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleGender(option.value)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                  profile.gender === option.value
                    ? 'bg-[#141414] text-white'
                    : 'border border-[#e8e0d0] text-[#333333] hover:bg-[#f2ede3]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-xs font-medium uppercase tracking-wider text-[#333333]/50">
            I want to meet
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(INTEREST_MAP).map(label => {
              const value = INTEREST_MAP[label];
              const active = interested.includes(value);
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

        <div>
          <label className="mb-3 block text-xs font-medium uppercase tracking-wider text-[#333333]/50">
            Relationship intention
          </label>
          <div className="flex flex-wrap gap-2">
            {INTENTION_OPTIONS.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => onChange({ ...profile, relationship_intention: option })}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                  profile.relationship_intention === option
                    ? 'bg-[#141414] text-white'
                    : 'border border-[#e8e0d0] text-[#333333] hover:bg-[#f2ede3]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  );
}
