// src/features/messages/components/ConversationTimestamp.tsx

type Props = {
  value?: string | null;
};

export default function ConversationTimestamp({
  value,
}: Props) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  const now = new Date();

  const sameDay =
    date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.toDateString() ===
    yesterday.toDateString();

  let label: string;

  if (sameDay) {
    label = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (isYesterday) {
    label = 'Yesterday';
  } else {
    label = date.toLocaleDateString([], {
      day: 'numeric',
      month: 'short',
    });
  }

  return (
    <span className="text-xs text-gray-400 whitespace-nowrap">
      {label}
    </span>
  );
}