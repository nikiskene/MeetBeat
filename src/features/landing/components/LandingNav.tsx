// src/features/landing/components/LandingNav.tsx
import { WHITE_LOGO } from '../constants/landingAssets';

type Props = {
  onSignUp: () => void;
  onSignIn: () => void;
};

export function LandingNav({ onSignUp, onSignIn }: Props) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12">
      <img src={WHITE_LOGO} alt="BEAT" className="h-7 brightness-0" />

      <div className="flex items-center gap-3">
        <button
          onClick={onSignIn}
          className="text-sm font-medium text-[#141414] hover:text-[#b07d6c] transition-colors px-4 py-2"
        >
          Sign in
        </button>

        <button
          onClick={onSignUp}
          className="text-sm font-medium bg-[#141414] text-[#fdfcf9] px-5 py-2.5 rounded-full hover:bg-[#333333] transition-colors"
        >
          Join BEAT
        </button>
      </div>
    </nav>
  );
}