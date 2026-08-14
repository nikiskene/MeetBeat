// src/features/landing/components/LandingFooter.tsx
import { ArrowRight } from 'lucide-react';
import { BLACK_LOGO } from '../constants/landingAssets';
import LegalFooter from '../../legal/components/LegalFooter';
import type { CmsMap } from '../../cms/hooks/useCmsGroup';
import { pick } from '../../cms/hooks/useCmsGroup';
import { LANDING_FALLBACK } from '../constants/landingFallback';

type Props = {
  onSignUp: () => void;
  content: CmsMap;
};

export function LandingFooter({ onSignUp, content }: Props) {
  const title = pick(content, 'welcome.cta.title', LANDING_FALLBACK['welcome.cta.title']);
  const body = pick(content, 'welcome.cta.body', LANDING_FALLBACK['welcome.cta.body']);
  const button = pick(content, 'welcome.cta.button', LANDING_FALLBACK['welcome.cta.button']);

  return (
    <>
      <section className="py-32 bg-[#f2ede3]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <img
            src={BLACK_LOGO}
            alt="BEAT"
            className="h-8 mx-auto mb-10 opacity-80"
          />

          <h2 className="text-4xl md:text-5xl font-light text-[#141414] mb-6 leading-tight">
            {title}
          </h2>

          <p className="text-[#333333]/70 text-lg mb-10 max-w-md mx-auto leading-relaxed">
            {body}
          </p>

          <button
            type="button"
            onClick={onSignUp}
            className="inline-flex items-center gap-2 bg-[#141414] text-[#fdfcf9] px-10 py-4 rounded-full font-medium hover:bg-[#333333] transition-colors text-base"
          >
            {button}
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <LegalFooter />
    </>
  );
}
