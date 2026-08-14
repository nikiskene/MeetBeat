// src/features/messages/components/UserName.tsx

type Props = {
  name?: string | null;
  verified?: boolean;
};

export default function UserName({
  name,
  verified = false,
}: Props) {
  return (
    <div className="flex items-center gap-1">
      <span className="truncate font-medium text-gray-900">
        {name ?? 'Unknown'}
      </span>

      {verified && (
        <svg
          className="h-4 w-4 text-blue-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 1.5l2.1 2.14 2.98-.41.92 2.86 2.68 1.39-1.39 2.68.41 2.98-2.86.92L12.1 18.5 10 16.36 7.9 18.5l-2.14-2.1-2.98.41-.92-2.86L-.82 10.57.57 7.89.16 4.91l2.86-.92L5.76 1.5 10 1.5zm2.74 6.49a.75.75 0 10-1.08-1.04L8.86 9.86 7.84 8.84A.75.75 0 006.78 9.9l1.55 1.55a.75.75 0 001.06 0l3.35-3.46z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  );
}