import type { ReactNode } from 'react';
import type { OnboardingProfile } from '../services/onboardingService';
import type { DiscoverySettings } from '../../settings/types/settings.types';
import type { MoodWheelOption } from '../../settings/constants/moodWheelOptions';
import { WelcomeStep } from './WelcomeStep';
import { IdentityStep } from './IdentityStep';
import { NameStep } from './NameStep';
import { LocationStep } from './LocationStep';
import { BioStep } from './BioStep';
import { PhotoStep } from './PhotoStep';
import { DiscoveryStep } from './DiscoveryStep';
import { MoodStep } from './MoodStep';
import { DoneStep } from './DoneStep';
import type { OnboardingStepId } from '../constants/onboardingContent';

type Props = {
  step: OnboardingStepId;
  profile: OnboardingProfile;
  discovery: DiscoverySettings;
  userId?: string;
  onProfileChange: (p: OnboardingProfile) => void;
  onDiscoveryChange: (s: DiscoverySettings) => void;
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
  discovery,
  userId,
  onProfileChange,
  onDiscoveryChange,
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
    case 'discovery':
      return <DiscoveryStep settings={discovery} onChange={onDiscoveryChange} onNext={onNext} onBack={onBack} />;
    case 'mood':
      return (
        <MoodStep
          enabledOptions={(profile.mood_wheel_options as MoodWheelOption[] | undefined) ?? []}
          onNext={onNext}
          onBack={onBack}
        />
      );
    case 'done':
      return <DoneStep onExplore={onComplete} onProfile={onEditProfile} />;
    default:
      return null;
  }
}
