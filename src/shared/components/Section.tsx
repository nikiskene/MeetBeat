// src/shared/components/Section.tsx
import React from 'react';

interface SectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Section({
  title,
  description,
  children,
  className = '',
}: SectionProps) {
  return (
    <section className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div>
          {title && (
            <h2 className="text-lg font-medium text-[#141414]">
              {title}
            </h2>
          )}

          {description && (
            <p className="mt-1 text-sm text-[#333333]/60">
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </section>
  );
}