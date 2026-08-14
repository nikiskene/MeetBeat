import { ArrowRight } from 'lucide-react';
import { ONBOARDING_COPY } from '../constants/onboardingContent';

type Props = {
  onNext: () => void;
};

export function WelcomeStep({ onNext }: Props) {
  const copy = ONBOARDING_COPY.welcome;
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-[#b07d6c]">
        {copy.eyebrow}
      </p>
      <h1 className="mb-6 max-w-lg text-3xl font-light leading-tight text-[#141414] md:text-4xl">
        {copy.title}
      </h1>
      <p className="mb-10 max-w-md text-sm leading-relaxed text-[#333333]/65">
        {copy.body}
      </p>
      <button
        type="button"
        onClick={onNext}
        className="inline-flex items-center gap-2 rounded-full bg-[#141414] px-8 py-4 text-sm font-medium text-white transition hover:bg-[#333333]"
      >
        {copy.cta}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
