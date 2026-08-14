// src/shared/components/EmptyState.tsx
import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl bg-[#f9f6f0] border border-[#e8e0d0] p-10 text-center">
      {icon && (
        <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-[#f2ede3] flex items-center justify-center text-[#b07d6c]">
          {icon}
        </div>
      )}

      <h2 className="text-xl font-light text-[#141414]">
        {title}
      </h2>

      {description && (
        <p className="mt-3 text-sm leading-relaxed text-[#333333]/60 max-w-md mx-auto">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-8">
          {action}
        </div>
      )}
    </div>
  );
}