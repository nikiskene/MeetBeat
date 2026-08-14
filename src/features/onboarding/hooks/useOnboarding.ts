import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  fetchOnboardingDiscovery,
  fetchOnboardingProfile,
  isProfileComplete,
  saveOnboardingDiscovery,
  saveOnboardingProfile,
  saveMoodWheelOptions,
  type OnboardingProfile,
} from '../services/onboardingService';
import type { DiscoverySettings } from '../../settings/types/settings.types';
import type { MoodWheelOption } from '../../settings/constants/moodWheelOptions';
import type { OnboardingStepId } from '../constants/onboardingContent';

type State = {
  loading: boolean;
  error: string;
  profile: OnboardingProfile;
  discovery: DiscoverySettings | null;
  complete: boolean;
  setProfile: (profile: OnboardingProfile) => void;
  setDiscovery: (settings: DiscoverySettings) => void;
  saveProfile: () => Promise<void>;
  saveDiscovery: () => Promise<void>;
  saveMoodOptions: (options: MoodWheelOption[]) => Promise<void>;
  reload: () => void;
};

const EMPTY_PROFILE: OnboardingProfile = {};

export function useOnboarding(): State {
  const { user } = useAuth();
  const [profile, setProfile] = useState<OnboardingProfile>(EMPTY_PROFILE);
  const [discovery, setDiscovery] = useState<DiscoverySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [profileData, discoveryData] = await Promise.all([
        fetchOnboardingProfile(user.id),
        fetchOnboardingDiscovery(user.id),
      ]);
      setProfile(profileData ?? EMPTY_PROFILE);
      setDiscovery(discoveryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, [user, retryKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfile = useCallback(async () => {
    if (!user) return;
    try {
      await saveOnboardingProfile(user.id, profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
      throw err;
    }
  }, [user, profile]);

  const saveDiscovery = useCallback(async () => {
    if (!discovery) return;
    try {
      await saveOnboardingDiscovery(discovery);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
      throw err;
    }
  }, [discovery]);

  const saveMoodOptions = useCallback(
    async (options: MoodWheelOption[]) => {
      if (!user) return;
      try {
        await saveMoodWheelOptions(user.id, options);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save.');
        throw err;
      }
    },
    [user],
  );

  return {
    loading,
    error,
    profile,
    discovery,
    complete: isProfileComplete(profile),
    setProfile,
    setDiscovery,
    saveProfile,
    saveDiscovery,
    saveMoodOptions,
    reload: () => setRetryKey(key => key + 1),
  };
}

export function getOnboardingStep(
  profile: OnboardingProfile,
): OnboardingStepId {
  if (!profile.display_name?.trim()) return 'identity';
  if (!profile.birthdate) return 'name';
  if (profile.gender == null) return 'identity';
  if (!profile.city || profile.latitude == null) return 'location';
  return 'bio';
}
