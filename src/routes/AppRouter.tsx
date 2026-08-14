// src/routes/AppRouter.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { PasswordRecoveryHandler } from './PasswordRecoveryHandler';
import type { AuthScreen } from './types';
import LegalPage from '../features/legal/pages/LegalPage';
import { legalPageFromHash } from '../features/legal/legalContent';
import { useLocationRefresh } from '../features/profile/hooks/useLocationRefresh';
import { useOnboardingCheck } from '../features/onboarding/hooks/useOnboardingCheck';
import OnboardingPage from '../features/onboarding/pages/OnboardingPage';

type OnboardingExit = 'today' | 'profile';

export function AppRouter() {
  const { user, loading, signOut } = useAuth();
  const [screen, setScreen] = useState<AuthScreen>('landing');
  const [legalPage, setLegalPage] = useState(() => legalPageFromHash(window.location.hash));
  const [onboardingExit, setOnboardingExit] = useState<OnboardingExit>('today');
  useLocationRefresh(user?.id);
  const { loading: onboardingLoading, needsOnboarding } = useOnboardingCheck(user?.id);

  useEffect(() => {
    const syncHash = () => setLegalPage(legalPageFromHash(window.location.hash));
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  if (loading || (user && onboardingLoading)) {
    return (
      <div className="min-h-screen bg-[#fdfcf9] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#dfc4b8] border-t-[#b07d6c] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PasswordRecoveryHandler onScreenChange={setScreen} />

      {legalPage ? (
        <LegalPage
          page={legalPage}
          onBack={() => {
            history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
            setLegalPage(null);
          }}
        />
      ) : screen === 'update-password' ? (
        <AuthNavigator screen={screen} onScreenChange={setScreen} />
      ) : user ? (
        needsOnboarding ? (
          <OnboardingPage
            onComplete={() => setOnboardingExit('today')}
            onEditProfile={() => setOnboardingExit('profile')}
          />
        ) : (
          <MainNavigator
            onSignOut={signOut}
            initialTab={onboardingExit === 'profile' ? 'profile' : 'today'}
          />
        )
      ) : (
        <AuthNavigator screen={screen} onScreenChange={setScreen} />
      )}
    </>
  );
}
