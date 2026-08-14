// src/features/profile/components/AvatarUploader.tsx
import Avatar from '../../../shared/components/Avatar';
import { Camera } from 'lucide-react';
import { uploadAvatar } from '../services/profilePhotos';

type Props = {
  userId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  onUploaded: (url: string) => void;
  onError: (message: string) => void;
};

export function AvatarUploader({
  userId,
  email,
  displayName,
  avatarUrl,
  onUploaded,
  onError,
}: Props) {
  async function handleFile(file?: File) {
    if (!file) return;

    try {
      const url = await uploadAvatar(userId, file);
      onUploaded(url);
    } catch (error) {
      onError(
        error instanceof Error ? error.message : 'Avatar upload failed.'
      );
    }
  }

  return (
    <div className="relative w-fit">
      <Avatar
        src={avatarUrl}
        name={displayName || email || '?'}
        size={96}
      />

      <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#141414] text-white flex items-center justify-center cursor-pointer hover:bg-[#333333] transition-colors">
        <Camera size={14} />

        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </label>
    </div>
  );
}