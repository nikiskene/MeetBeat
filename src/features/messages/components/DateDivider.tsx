// src/features/messages/components/DateDivider.tsx

type Props = {
  current: string;
  previous?: string;
};

function formatLabel(date: Date) {
  const today = new Date();

  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const messageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const diff =
    (todayOnly.getTime() - messageDay.getTime()) /
    86400000;

  if (diff === 0) {
    return 'Today';
  }

  if (diff === 1) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year:
      date.getFullYear() !== today.getFullYear()
        ? 'numeric'
        : undefined,
  });
}

export default function DateDivider({
  current,
  previous,
}: Props) {
  const currentDate = new Date(current);

  const previousDate = previous
    ? new Date(previous)
    : null;

  const show =
    !previousDate ||
    currentDate.toDateString() !==
      previousDate.toDateString();

  if (!show) {
    return null;
  }

  return (
    <div className="my-6 flex items-center">
      <div className="h-px flex-1 bg-gray-200" />

      <span className="mx-4 text-xs font-medium text-gray-400">
        {formatLabel(currentDate)}
      </span>

      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}