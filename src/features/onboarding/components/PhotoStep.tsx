import { useAuth } from '../../../contexts/AuthContext';
import { AvatarUploader } from '../../profile/components/AvatarUploader';
import type { OnboardingProfile } from '../services/onboardingService';
import { ONBOARDING_COPY } from '../constants/onboardingContent';
import { StepShell } from './StepShell';

type Props = {
  profile: OnboardingProfile;
  onAvatarUploaded: (url: string) => void;
  onError: (message: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export function PhotoStep({
  profile,
  onAvatarUploaded,
  onError,
  onNext,
  onBack,
}: Props) {
  const copy = ONBOARDING_COPY.photo;
  const { user } = useAuth();

  return (
    <StepShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      body={copy.body}
      onBack={onBack}
      onNext={onNext}
      canProceed={true}
      nextLabel={profile.avatar_url ? 'Continue' : copy.skip}
    >
      <div className="flex flex-col items-center gap-6">
        {user && (
          <AvatarUploader
            userId={user.id}
            email={user.email}
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            onUploaded={onAvatarUploaded}
            onError={onError}
          />
        )}
        <p className="text-xs text-[#333333]/40">
          Tap the camera icon to upload. JPG or PNG.
        </p>
      </div>
    </StepShell>
  );
}
