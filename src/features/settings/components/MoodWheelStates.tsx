export function MoodWheelLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#dfc4b8] border-t-[#b07d6c]" />
    </div>
  );
}

export function MoodWheelDisabled() {
  return (
    <div className="rounded-[2.25rem] border border-[#dfd4c6] bg-[#eee5d8] px-8 py-14 text-center shadow-[0_24px_70px_rgba(74,56,42,0.1)]">
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-[#a16f5f]">
        Daily Mood Wheel
      </p>
      <h2 className="text-2xl font-light text-[#171513]">
        Your mood wheel is disabled.
      </h2>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[#4b4038]/55">
        Enable at least one option in Settings to choose your daily beat.
      </p>
    </div>
  );
}
