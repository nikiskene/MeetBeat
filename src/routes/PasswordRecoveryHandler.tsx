// src/routes/PasswordRecoveryHandler.tsx
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { AuthScreen } from './types';

type Props = {
  onScreenChange: (screen: AuthScreen) => void;
};

export function PasswordRecoveryHandler({ onScreenChange }: Props) {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') {
        onScreenChange('update-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [onScreenChange]);

  return null;
}