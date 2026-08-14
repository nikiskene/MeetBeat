import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { isProfileComplete } from '../services/onboardingService';
import type { OnboardingProfile } from '../services/onboardingService';

type State = {
  loading: boolean;
  needsOnboarding: boolean;
};

export function useOnboardingCheck(userId?: string): State {
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) {
          setNeedsOnboarding(true);
        } else {
          setNeedsOnboarding(!isProfileComplete(data as OnboardingProfile));
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return { loading, needsOnboarding };
}
