// src/features/profile/components/ProfileGalleryEditor.tsx
import { Camera } from 'lucide-react';
import type { ProfilePhoto } from '../services/profilePhotos';
import { uploadGalleryPhoto } from '../services/profilePhotos';

type Props = {
  userId: string;
  photos: ProfilePhoto[];
  onUploaded: () => void;
  onError: (message: string) => void;
};

export function ProfileGalleryEditor({
  userId,
  photos,
  onUploaded,
  onError,
}: Props) {
  async function handleFile(file: File | undefined, position: number) {
    if (!file) return;

    try {
      await uploadGalleryPhoto(userId, file, position);
      onUploaded();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Photo upload failed.');
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map(position => {
        const photo = photos.find(item => item.position === position);

        return (
          <label
            key={position}
            className="aspect-square rounded-2xl bg-[#f2ede3] border-2 border-dashed border-[#dfc4b8] flex items-center justify-center cursor-pointer hover:bg-[#e8e0d0] transition-colors overflow-hidden"
          >
            {photo ? (
              <img
                src={photo.photo_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera size={20} className="text-[#c9a090]" />
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={event => handleFile(event.target.files?.[0], position)}
            />
          </label>
        );
      })}
    </div>
  );
}