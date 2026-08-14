// src/shared/components/ErrorMessage.tsx
import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message?: string;
  children?: ReactNode;
  className?: string;
}

export default function ErrorMessage({
  message,
  children,
  className = '',
}: ErrorMessageProps) {
  const content = children ?? message;
  if (!content) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 ${className}`}
    >
      <AlertCircle
        size={18}
        className="text-red-600 mt-0.5 flex-shrink-0"
      />

      <p className="text-sm text-red-700 leading-relaxed">
        {content}
      </p>
    </div>
  );
}
