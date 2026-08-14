// src/shared/components/PageHeader.tsx
import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="text-[#b07d6c] text-xs font-medium tracking-[0.2em] uppercase mb-2">
          {eyebrow}
        </p>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-[#141414]">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-sm text-[#333333]/60 max-w-xl">
              {subtitle}
            </p>
          )}
        </div>

        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}