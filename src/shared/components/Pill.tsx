// src/shared/components/Pill.tsx
import React from 'react';

interface PillProps {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export default function Pill({
  active = false,
  children,
  onClick,
  disabled = false,
}: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-full text-sm transition-colors disabled:opacity-40 disabled:pointer-events-none ${
        active
          ? 'bg-[#141414] text-white'
          : 'bg-[#f2ede3] text-[#333333] hover:bg-[#e8e0d0]'
      }`}
    >
      {children}
    </button>
  );
}