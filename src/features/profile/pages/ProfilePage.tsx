// src/features/profile/pages/ProfilePage.tsx
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileForm } from '../components/ProfileForm';
import {
  fetchGalleryPhotos,
  type ProfilePhoto,
} from '../services/profilePhotos';
import type { Profile } from '../types/profile.types';

interface ProfilePageProps {
  onSignOut: () => void;
}

export default function ProfilePage({ onSignOut }: ProfilePageProps) {
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile>({});
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const loadPhotos = useCallback(async () => {
    if (!user) return;
    const nextPhotos = await fetchGalleryPhotos(user.id);
    setPhotos(nextPhotos);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    async function loadProfile() {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) setError(error.message);
      if (data) setProfile(data);

      try {
        await loadPhotos();
      } catch (photoError) {
        setError(
          photoError instanceof Error
            ? photoError.message
            : 'Could not load photos.'
        );
      }

      setLoading(false);
    }

    loadProfile();
  }, [user, loadPhotos]);

  const handleSave = async () => {
    if (!user) return;

    setError('');
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .upsert({ ...profile, id: user.id });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 md:px-12">
      <ProfileHeader
        userId={user.id}
        email={user.email}
        profile={profile}
        onAvatarUploaded={url =>
          setProfile(p => ({
            ...p,
            avatar_url: url,
          }))
        }
        onError={setError}
      />

      <ProfileForm
        userId={user.id}
        profile={profile}
        photos={photos}
        saving={saving}
        saved={saved}
        error={error}
        onChange={setProfile}
        onSave={handleSave}
        onSignOut={onSignOut}
        onPhotosUploaded={loadPhotos}
        onError={setError}
      />
    </div>
  );
}