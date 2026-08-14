// src/features/settings/components/ActiveMood.tsx
import { Clock } from 'lucide-react';

type Props = {
  label: string;
  remainingLabel: string;
  onEdit: () => void;
  onReset: () => void;
};

export function ActiveMood({
  label,
  remainingLabel,
  onEdit,
  onReset,
}: Props) {
  return (
    <div className="rounded-[2.25rem] border border-[#dfd4c6] bg-[#eee5d8] px-8 py-14 text-center shadow-[0_24px_70px_rgba(74,56,42,0.1)]">
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-[#a16f5f]">
        {label}
      </p>

      <h2 className="text-2xl font-light text-[#171513]">
        We are finding your beat.
      </h2>

      <div className="mx-auto my-8 flex h-20 w-20 items-center justify-center rounded-full border border-[#cfbcaa] bg-[#f8f2e9]">
        <div className="h-8 w-8 animate-pulse rounded-full border-2 border-[#b78270]" />
      </div>

      <p className="mx-auto max-w-sm text-sm leading-relaxed text-[#4b4038]/55">
        BEAT is looking for someone whose intention fits yours.
      </p>

      <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#4b4038]/45">
        <Clock size={13} />
        {remainingLabel}
      </p>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-2xl bg-[#171513] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#332e29]"
        >
          Change today&apos;s beat
        </button>

        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl border border-[#cdbba9] bg-[#f8f2e9] px-6 py-3 text-sm font-medium text-[#5d493d] transition hover:bg-white"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
