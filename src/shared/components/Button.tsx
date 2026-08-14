// src/shared/components/Button.tsx
import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const styles = {
    primary:
      'bg-[#141414] text-white hover:bg-[#333333]',
    secondary:
      'bg-[#f2ede3] text-[#141414] hover:bg-[#e8e0d0]',
    ghost:
      'bg-transparent text-[#141414] hover:bg-[#f2ede3]',
  };

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}