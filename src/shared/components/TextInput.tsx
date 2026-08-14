// src/shared/components/TextInput.tsx
import React from 'react';

interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function TextInput({
  label,
  error,
  className = '',
  ...props
}: TextInputProps) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-medium uppercase tracking-wider text-[#333333]/50 mb-2">
          {label}
        </span>
      )}

      <input
        {...props}
        className={`w-full bg-[#f9f6f0] border rounded-xl px-4 py-3 text-sm text-[#141414] placeholder-[#333333]/30 focus:outline-none transition-colors ${
          error
            ? 'border-red-300 focus:border-red-500'
            : 'border-[#e8e0d0] focus:border-[#b07d6c]'
        } ${className}`}
      />

      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </label>
  );
}