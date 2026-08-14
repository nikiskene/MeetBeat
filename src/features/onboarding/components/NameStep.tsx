import type { OnboardingProfile } from '../services/onboardingService';
import { ONBOARDING_COPY } from '../constants/onboardingContent';
import { StepShell } from './StepShell';

type Props = {
  profile: OnboardingProfile;
  onChange: (profile: OnboardingProfile) => void;
  onNext: () => void;
  onBack: () => void;
};

function isAdult(birthdate: string): boolean {
  if (!birthdate) return false;
  const date = new Date(birthdate);
  if (Number.isNaN(date.getTime())) return false;
  const age = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return age >= 18;
}

export function NameStep({ profile, onChange, onNext, onBack }: Props) {
  const copy = ONBOARDING_COPY.name;
  const canProceed =
    Boolean(profile.display_name?.trim()) && isAdult(profile.birthdate ?? '');

  return (
    <StepShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      body={copy.body}
      onBack={onBack}
      onNext={onNext}
      canProceed={canProceed}
    >
      <div className="space-y-6">
        <div>
          <label htmlFor="ob-name" className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#333333]/50">
            Display name
          </label>
          <input
            id="ob-name"
            type="text"
            value={profile.display_name ?? ''}
            onChange={e => onChange({ ...profile, display_name: e.target.value })}
            placeholder="How should people know you?"
            className="w-full rounded-xl border border-[#e8e0d0] bg-[#f9f6f0] px-4 py-3.5 text-sm text-[#141414] outline-none transition focus:border-[#b07d6c]"
          />
        </div>

        <div>
          <label htmlFor="ob-dob" className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#333333]/50">
            Date of birth
          </label>
          <input
            id="ob-dob"
            type="date"
            value={profile.birthdate ?? ''}
            onChange={e => onChange({ ...profile, birthdate: e.target.value })}
            className="w-full rounded-xl border border-[#e8e0d0] bg-[#f9f6f0] px-4 py-3.5 text-sm text-[#141414] outline-none transition focus:border-[#b07d6c]"
          />
          {profile.birthdate && !isAdult(profile.birthdate) && (
            <p className="mt-2 text-sm text-red-600">
              You must be 18 or older to use BEAT.
            </p>
          )}
        </div>
      </div>
    </StepShell>
  );
}
