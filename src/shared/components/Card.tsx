// src/shared/components/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = '',
}: CardProps) {
  return (
    <div
      className={`rounded-3xl bg-[#f9f6f0] border border-[#e8e0d0] p-6 ${className}`}
    >
      {children}
    </div>
  );
}