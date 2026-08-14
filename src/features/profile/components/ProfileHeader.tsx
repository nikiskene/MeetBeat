// src/features/profile/components/ProfileHeader.tsx
import Card from '../../../shared/components/Card';
import PageHeader from '../../../shared/components/PageHeader';
import { AvatarUploader } from './AvatarUploader';
import type { Profile } from '../types/profile.types';

type Props = {
  userId: string;
  email?: string;
  profile: Profile;
  onAvatarUploaded: (url: string) => void;
  onError: (message: string) => void;
};

export function ProfileHeader({
  userId,
  email,
  profile,
  onAvatarUploaded,
  onError,
}: Props) {
  return (
    <>
      <PageHeader
        title={profile.display_name || 'Your profile'}
        subtitle={email}
      />

      <Card className="mb-8">
        <div className="flex items-start gap-6">
          <AvatarUploader
            userId={userId}
            email={email}
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            onUploaded={onAvatarUploaded}
            onError={onError}
          />
        </div>
      </Card>
    </>
  );
}