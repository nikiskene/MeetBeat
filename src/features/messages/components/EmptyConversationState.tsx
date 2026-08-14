// src/features/messages/components/EmptyConversationState.tsx

type Props = {
  name?: string | null;
};

export default function EmptyConversationState({
  name,
}: Props) {
  return (
    <div className="flex flex-1 items-center justify-center px-8">
      <div className="max-w-sm text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Start the conversation
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          {name
            ? `You matched with ${name}. Say hello and break the ice.`
            : 'You matched with someone. Say hello and break the ice.'}
        </p>
      </div>
    </div>
  );
}