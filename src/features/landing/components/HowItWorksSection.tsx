// src/features/landing/components/HowItWorksSection.tsx
import type { CmsMap } from '../../cms/hooks/useCmsGroup';
import { pick } from '../../cms/hooks/useCmsGroup';
import { LANDING_FALLBACK } from '../constants/landingFallback';

type Props = {
  content: CmsMap;
};

export function HowItWorksSection({ content }: Props) {
  const steps = [
    {
      num: '01',
      title: pick(content, 'welcome.step_1.title', LANDING_FALLBACK['welcome.step_1.title']),
      body: pick(content, 'welcome.step_1.body', LANDING_FALLBACK['welcome.step_1.body']),
    },
    {
      num: '02',
      title: pick(content, 'welcome.step_2.title', LANDING_FALLBACK['welcome.step_2.title']),
      body: pick(content, 'welcome.step_2.body', LANDING_FALLBACK['welcome.step_2.body']),
    },
    {
      num: '03',
      title: pick(content, 'welcome.step_3.title', LANDING_FALLBACK['welcome.step_3.title']),
      body: pick(content, 'welcome.step_3.body', LANDING_FALLBACK['welcome.step_3.body']),
    },
  ];

  return (
    <section id="how" className="py-28 px-6 md:px-12 max-w-6xl mx-auto">
      <p className="text-[#b07d6c] text-sm font-medium tracking-[0.2em] uppercase mb-4">
        {pick(content, 'welcome.how_it_works.label', LANDING_FALLBACK['welcome.how_it_works.label'])}
      </p>

      <h2 className="text-4xl md:text-5xl font-light text-[#141414] mb-16 max-w-xl leading-tight">
        {pick(content, 'welcome.how_it_works.title', LANDING_FALLBACK['welcome.how_it_works.title'])}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map(step => (
          <div
            key={step.num}
            className="group p-8 rounded-3xl bg-[#f9f6f0] hover:bg-[#f2ede3] transition-colors"
          >
            <span className="text-[#dfc4b8] text-5xl font-light block mb-6">
              {step.num}
            </span>
            <h3 className="text-xl font-medium text-[#141414] mb-3">
              {step.title}
            </h3>
            <p className="text-[#333333]/70 leading-relaxed">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
