// src/features/messages/components/TypingIndicator.tsx

type Props = {
  visible: boolean;
  name?: string | null;
};

export default function TypingIndicator({
  visible,
  name,
}: Props) {
  if (!visible) {
    return null;
  }

  return (
    <div className="flex justify-start px-6 py-2">
      <div className="rounded-2xl bg-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {name
              ? `${name} is typing...`
              : 'Typing...'}
          </span>

          <div className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
              style={{ animationDelay: '0.15s' }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
              style={{ animationDelay: '0.3s' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}