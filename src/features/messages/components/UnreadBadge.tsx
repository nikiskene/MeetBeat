// src/features/messages/components/UnreadBadge.tsx

type Props = {
  count: number;
};

export default function UnreadBadge({
  count,
}: Props) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-black px-2 py-1 text-xs font-medium leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}