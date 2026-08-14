// src/features/landing/pages/LandingPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { HERO_IMAGES } from '../constants/landingAssets';
import { LandingNav } from '../components/LandingNav';
import { HeroSection } from '../components/HeroSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { ConversationFirstSection } from '../components/ConversationFirstSection';
import { SafetySection } from '../components/SafetySection';
import { LandingFooter } from '../components/LandingFooter';
import { useCmsGroup, pick } from '../../cms/hooks/useCmsGroup';
import { LANDING_FALLBACK } from '../constants/landingFallback';

interface LandingPageProps {
  onSignUp: () => void;
  onSignIn: () => void;
}

export default function LandingPage({
  onSignUp,
  onSignIn,
}: LandingPageProps) {
  const [heroIndex, setHeroIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const { content } = useCmsGroup('welcome');

  const copy = useMemo(
    () => ({
      eyebrow: pick(content, 'welcome.hero.eyebrow', LANDING_FALLBACK['welcome.hero.eyebrow']),
      title: pick(content, 'welcome.hero.title', LANDING_FALLBACK['welcome.hero.title']),
      body: pick(content, 'welcome.hero.body', LANDING_FALLBACK['welcome.hero.body']),
      join: pick(content, 'welcome.hero.join', LANDING_FALLBACK['welcome.hero.join']),
      signIn: pick(content, 'welcome.hero.sign_in', LANDING_FALLBACK['welcome.hero.sign_in']),
    }),
    [content],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setHeroIndex(index => (index + 1) % HERO_IMAGES.length);
        setFade(true);
      }, 600);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#fdfcf9] text-[#141414]">
      <LandingNav onSignUp={onSignUp} onSignIn={onSignIn} />

      <HeroSection
        heroIndex={heroIndex}
        fade={fade}
        onSignUp={onSignUp}
        onSignIn={onSignIn}
        copy={copy}
      />

      <HowItWorksSection content={content} />
      <ConversationFirstSection content={content} />
      <SafetySection />
      <LandingFooter onSignUp={onSignUp} content={content} />
    </div>
  );
}
