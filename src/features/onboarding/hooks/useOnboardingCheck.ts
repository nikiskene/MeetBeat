import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { fetchConnectionProfile } from '../../connection/services/connectionProfile';
import { isProfileComplete } from '../services/onboardingService';
import type { OnboardingProfile } from '../services/onboardingService';

type State = {
  loading: boolean;
  needsProfile: boolean;
  needsConnectionProfile: boolean;
};

export function useOnboardingCheck(userId?: string, refreshKey = 0): State {
  const [state, setState] = useState<State>({
    loading: true,
    needsProfile: false,
    needsConnectionProfile: false,
  });

  useEffect(() => {
    if (!userId) {
      setState({ loading: false, needsProfile: false, needsConnectionProfile: false });
      return;
    }
    const currentUserId = userId;
    let active = true;
    async function load() {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUserId).maybeSingle();
      const needsProfile = Boolean(error || !data || !isProfileComplete(data as OnboardingProfile));
      let needsConnectionProfile = false;
      if (!needsProfile) {
        try { needsConnectionProfile = !(await fetchConnectionProfile(currentUserId)); }
        catch { needsConnectionProfile = true; }
      }
      if (active) setState({ loading: false, needsProfile, needsConnectionProfile });
    }
    void load();
    return () => { active = false; };
  }, [refreshKey, userId]);

  return state;
}
