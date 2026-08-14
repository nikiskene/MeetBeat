// src/features/settings/components/MoodMachine.tsx

import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

type Props = {
  label: string;
  spinning: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  onRandom: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  randomLabel?: string;
  instructionLabel?: string;
};

export function MoodMachine({
  label,
  spinning,
  onPrevious,
  onNext,
  onWheel,
  onRandom,
  onConfirm,
  confirmLabel = 'Choose this beat',
  randomLabel = 'Surprise me',
  instructionLabel = 'Scroll, use the arrows, or let chance choose.',
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-[2.25rem] border border-[#dfd4c6] bg-[#eee5d8] p-5 shadow-[0_24px_70px_rgba(74,56,42,0.12)] md:p-8">
      <div className="absolute inset-x-10 top-0 h-px bg-white/80" />

      <div className="rounded-[1.75rem] border border-[#cab9a7] bg-[#211e1b] p-4 shadow-inner md:p-6">
        <button
          type="button"
          onClick={onPrevious}
          disabled={spinning}
          className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9b48a] disabled:opacity-30"
          aria-label="Previous option"
        >
          <ChevronUp size={20} />
        </button>

        <div
          onWheel={onWheel}
          tabIndex={0}
          role="spinbutton"
          aria-label="Today's mood"
          aria-valuetext={label}
          onKeyDown={event => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              onNext();
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              onPrevious();
            }
          }}
          className="relative my-3 flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#f7f0e6] px-6 text-center shadow-[inset_0_12px_30px_rgba(69,49,33,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9b48a]"
        >
          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#d8c9b8]/75 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#d8c9b8]/75 to-transparent" />

          <p
            className={`relative z-10 max-w-sm text-3xl font-light tracking-tight text-[#191714] transition motion-reduce:transition-none ${
              spinning
                ? 'scale-95 opacity-65 blur-[1px] motion-reduce:blur-0'
                : 'scale-100 opacity-100'
            }`}
          >
            {label}
          </p>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={spinning}
          className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9b48a] disabled:opacity-30"
          aria-label="Next option"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <button
          type="button"
          onClick={onConfirm}
          disabled={spinning}
          className="rounded-2xl bg-[#171513] px-6 py-4 text-sm font-medium text-white transition hover:bg-[#332e29] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9b48a] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {confirmLabel}
        </button>

        <button
          type="button"
          onClick={onRandom}
          disabled={spinning}
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#cdbba9] bg-[#f8f2e9] px-6 py-4 text-sm font-medium text-[#5d493d] transition hover:-translate-y-0.5 hover:bg-white motion-reduce:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9b48a] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Sparkles size={16} />
          {spinning ? 'Rolling…' : randomLabel}
        </button>
      </div>

      <p className="mt-5 text-center text-xs text-[#4b4038]/45">
        {instructionLabel}
      </p>
    </div>
  );
}
