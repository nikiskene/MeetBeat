import type { ReactNode } from 'react';
import type { OnboardingProfile } from '../services/onboardingService';
import { WelcomeStep } from './WelcomeStep';
import { IdentityStep } from './IdentityStep';
import { NameStep } from './NameStep';
import { LocationStep } from './LocationStep';
import { BioStep } from './BioStep';
import { PhotoStep } from './PhotoStep';
import { DoneStep } from './DoneStep';
import type { OnboardingStepId } from '../constants/onboardingContent';

type Props = {
  step: OnboardingStepId;
  profile: OnboardingProfile;
  userId?: string;
  onProfileChange: (p: OnboardingProfile) => void;
  onAvatar: (url: string) => void;
  onError: (msg: string) => void;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
  onEditProfile: () => void;
};

export function OnboardingStepRenderer({
  step,
  profile,
  userId,
  onProfileChange,
  onAvatar,
  onError,
  onNext,
  onBack,
  onComplete,
  onEditProfile,
}: Props): ReactNode {
  switch (step) {
    case 'welcome':
      return <WelcomeStep onNext={onNext} />;
    case 'identity':
      return <IdentityStep profile={profile} onChange={onProfileChange} onNext={onNext} onBack={onBack} />;
    case 'name':
      return <NameStep profile={profile} onChange={onProfileChange} onNext={onNext} onBack={onBack} />;
    case 'location':
      return <LocationStep profile={profile} onChange={onProfileChange} onNext={onNext} onBack={onBack} />;
    case 'bio':
      return <BioStep profile={profile} onChange={onProfileChange} onNext={onNext} onBack={onBack} />;
    case 'photo':
      return userId ? (
        <PhotoStep profile={profile} onAvatarUploaded={onAvatar} onError={onError} onNext={onNext} onBack={onBack} />
      ) : null;
    case 'done':
      return <DoneStep onExplore={onComplete} onProfile={onEditProfile} />;
    default:
      return null;
  }
}
