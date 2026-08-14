// src/routes/AuthNavigator.tsx
import LandingPage from '../pages/LandingPage';
import AuthPage from '../pages/AuthPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import UpdatePasswordPage from '../pages/UpdatePasswordPage';
import type { AuthScreen } from './types';

type Props = {
  screen: AuthScreen;
  onScreenChange: (screen: AuthScreen) => void;
};

export function AuthNavigator({ screen, onScreenChange }: Props) {
  if (screen === 'update-password') {
    return <UpdatePasswordPage />;
  }

  if (screen === 'forgot-password') {
    return <ForgotPasswordPage onBack={() => onScreenChange('signin')} />;
  }

  if (screen === 'signin') {
    return (
      <AuthPage
        mode="signin"
        onBack={() => onScreenChange('landing')}
        onToggleMode={() => onScreenChange('signup')}
        onForgotPassword={() => onScreenChange('forgot-password')}
      />
    );
  }

  if (screen === 'signup') {
    return (
      <AuthPage
        mode="signup"
        onBack={() => onScreenChange('landing')}
        onToggleMode={() => onScreenChange('signin')}
        onForgotPassword={() => onScreenChange('forgot-password')}
      />
    );
  }

  return (
    <LandingPage
      onSignUp={() => onScreenChange('signup')}
      onSignIn={() => onScreenChange('signin')}
    />
  );
}