import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
  eyebrow: string;
  title: string;
  body: string;
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
  nextLabel?: string;
  children: ReactNode;
};

export function StepShell({
  eyebrow,
  title,
  body,
  onBack,
  onNext,
  canProceed,
  nextLabel = 'Continue',
  children,
}: Props) {
  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="mb-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[#b07d6c]">
          {eyebrow}
        </p>
        <h1 className="mb-4 max-w-lg text-3xl font-light leading-tight text-[#141414] md:text-4xl">
          {title}
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-[#333333]/65">
          {body}
        </p>
      </div>

      <div className="flex-1">{children}</div>

      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center gap-2 text-sm text-[#333333]/50 transition hover:text-[#141414]"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#141414] px-8 py-3.5 text-sm font-medium text-white transition hover:bg-[#333333] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {nextLabel}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
