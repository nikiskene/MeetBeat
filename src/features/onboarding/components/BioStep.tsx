import type { OnboardingProfile } from '../services/onboardingService';
import { ONBOARDING_COPY } from '../constants/onboardingContent';
import { StepShell } from './StepShell';

type Props = {
  profile: OnboardingProfile;
  onChange: (profile: OnboardingProfile) => void;
  onNext: () => void;
  onBack: () => void;
};

export function BioStep({ profile, onChange, onNext, onBack }: Props) {
  const copy = ONBOARDING_COPY.bio;
  const canProceed = Boolean(profile.bio?.trim());

  return (
    <StepShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      body={copy.body}
      onBack={onBack}
      onNext={onNext}
      canProceed={canProceed}
    >
      <div>
        <label htmlFor="ob-bio" className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#333333]/50">
          Bio
        </label>
        <textarea
          id="ob-bio"
          value={profile.bio ?? ''}
          onChange={e => onChange({ ...profile, bio: e.target.value })}
          placeholder="Values, curiosities, what lights you up…"
          rows={5}
          className="w-full resize-none rounded-xl border border-[#e8e0d0] bg-[#f9f6f0] px-4 py-3.5 text-sm text-[#141414] outline-none transition focus:border-[#b07d6c]"
        />
      </div>
    </StepShell>
  );
}
