// src/features/profile/services/profilePhotos.ts
import { supabase } from '../../../lib/supabase';

export type ProfilePhoto = {
  id: string;
  user_id: string;
  photo_url: string;
  position: number;
  created_at: string;
};

function getFileExt(file: File) {
  return file.name.split('.').pop()?.toLowerCase() || 'jpg';
}

export async function uploadAvatar(userId: string, file: File) {
  const ext = getFileExt(file);
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(path);

  const avatar_url = data.publicUrl;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url })
    .eq('id', userId);

  if (updateError) throw updateError;

  return avatar_url;
}

export async function fetchGalleryPhotos(userId: string) {
  const { data, error } = await supabase
    .from('profile_photos')
    .select('*')
    .eq('user_id', userId)
    .order('position');

  if (error) throw error;
  return data as ProfilePhoto[];
}

export async function uploadGalleryPhoto(
  userId: string,
  file: File,
  position: number
) {
  const ext = getFileExt(file);
  const path = `${userId}/gallery-${position}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(path);

  const photo_url = data.publicUrl;

  const { error: dbError } = await supabase
    .from('profile_photos')
    .upsert(
      {
        user_id: userId,
        position,
        photo_url,
      },
      { onConflict: 'user_id,position' }
    );

  if (dbError) throw dbError;

  return photo_url;
}