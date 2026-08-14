// src/features/landing/components/SafetySection.tsx
const ITEMS = [
  {
    title: 'Safety is default',
    body: 'Reporting, blocking, and unmatching are always one tap away. You control every interaction.',
  },
  {
    title: 'Intention over impulse',
    body: 'BEAT helps you say what you are actually looking for today, so connections start with honesty rather than guesswork.',
  },
  {
    title: 'Real moderation',
    body: 'Our team reviews flagged content and removes profiles that do not meet our community standards.',
  },
];

export function SafetySection() {
  return (
    <section className="py-28 px-6 md:px-12 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="order-2 md:order-1 space-y-4">
          {ITEMS.map(item => (
            <div
              key={item.title}
              className="p-6 rounded-2xl border border-[#e8e0d0] hover:border-[#dfc4b8] transition-colors"
            >
              <h3 className="font-medium text-[#141414] mb-2">
                {item.title}
              </h3>
              <p className="text-[#333333]/70 text-sm leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="order-1 md:order-2">
          <p className="text-[#b07d6c] text-sm font-medium tracking-[0.2em] uppercase mb-4">
            Safety & intention
          </p>

          <h2 className="text-4xl md:text-5xl font-light text-[#141414] leading-tight mb-6">
            A space built for trust.
          </h2>

          <p className="text-[#333333]/70 leading-relaxed">
            Meaningful connection requires emotional safety. Every decision we
            make in product and policy is guided by this principle.
          </p>
        </div>
      </div>
    </section>
  );
}
