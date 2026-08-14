// src/features/landing/components/HeroSection.tsx
import { ArrowRight, ChevronDown } from 'lucide-react';
import { HERO_IMAGES } from '../constants/landingAssets';
import { LANDING_FALLBACK } from '../constants/landingFallback';

type HeroCopy = {
  eyebrow: string;
  title: string;
  body: string;
  join: string;
  signIn: string;
};

type Props = {
  heroIndex: number;
  fade: boolean;
  onSignUp: () => void;
  onSignIn: () => void;
  copy: HeroCopy;
};

export function HeroSection({
  heroIndex,
  fade,
  onSignUp,
  onSignIn,
  copy,
}: Props) {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{
          backgroundImage: `url(${HERO_IMAGES[heroIndex]})`,
          opacity: fade ? 1 : 0,
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-24 md:px-12">
        <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-[#e8c4bb]">
          {copy.eyebrow}
        </p>

        <h1 className="mb-6 text-5xl font-light leading-[1.1] text-white md:text-7xl">
          {copy.title}
        </h1>

        <p className="mb-10 max-w-xl text-lg font-light leading-relaxed text-white/85 md:text-xl">
          {copy.body}
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={onSignUp}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-medium text-[#141414] transition-colors hover:bg-[#f2ede3]"
          >
            {copy.join}
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-white/10"
          >
            {copy.signIn}
          </button>
        </div>
      </div>

      <a
        href="#how"
        aria-label="See how BEAT works"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/60 transition-colors hover:text-white"
      >
        <ChevronDown size={28} />
      </a>
    </section>
  );
}

export { LANDING_FALLBACK };
