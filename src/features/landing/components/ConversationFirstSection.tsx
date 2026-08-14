// src/features/landing/components/ConversationFirstSection.tsx
import { Compass, Heart, MessageCircle, Shield } from 'lucide-react';
import type { CmsMap } from '../../cms/hooks/useCmsGroup';
import { pick } from '../../cms/hooks/useCmsGroup';
import { LANDING_FALLBACK } from '../constants/landingFallback';

type Props = {
  content: CmsMap;
};

export function ConversationFirstSection({ content }: Props) {
  const features = [
    {
      icon: <Heart size={22} />,
      label: pick(content, 'welcome.connection.feature.shared_intention', LANDING_FALLBACK['welcome.connection.feature.shared_intention']),
    },
    {
      icon: <Compass size={22} />,
      label: pick(content, 'welcome.connection.feature.compatibility', LANDING_FALLBACK['welcome.connection.feature.compatibility']),
    },
    {
      icon: <MessageCircle size={22} />,
      label: pick(content, 'welcome.connection.feature.own_pace', LANDING_FALLBACK['welcome.connection.feature.own_pace']),
    },
    {
      icon: <Shield size={22} />,
      label: pick(content, 'welcome.connection.feature.verified', LANDING_FALLBACK['welcome.connection.feature.verified']),
    },
  ];

  return (
    <section className="py-28 bg-[#141414] text-[#fdfcf9]">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[#c9b48a] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              {pick(content, 'welcome.connection.label', LANDING_FALLBACK['welcome.connection.label'])}
            </p>

            <h2 className="text-4xl md:text-5xl font-light leading-tight mb-8">
              {pick(content, 'welcome.connection.title', LANDING_FALLBACK['welcome.connection.title'])}
            </h2>

            <div className="space-y-6 text-[#fdfcf9]/70 leading-relaxed">
              <p>
                {pick(content, 'welcome.connection.body_1', LANDING_FALLBACK['welcome.connection.body_1'])}
              </p>
              <p>
                {pick(content, 'welcome.connection.body_2', LANDING_FALLBACK['welcome.connection.body_2'])}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map(feature => (
              <div
                key={feature.label}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3"
              >
                <span className="text-[#c9b48a]">{feature.icon}</span>
                <span className="text-sm font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
