// src/features/messages/components/ConversationPreview.tsx

import type { Conversation } from '../types/messages.types';

type Props = {
  conversation: Conversation;
  active?: boolean;
  onClick: () => void;
};

export default function ConversationPreview({
  conversation,
  active = false,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 border-b border-gray-100 px-5 py-4 text-left transition ${
        active
          ? 'bg-gray-100'
          : 'hover:bg-gray-50'
      }`}
    >
      <img
        src={
          conversation.profile.avatar_url ??
          '/images/avatar-placeholder.png'
        }
        alt={conversation.profile.display_name ?? 'Profile'}
        className="h-14 w-14 rounded-full object-cover"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="truncate font-medium">
            {conversation.profile.display_name ??
              'Unknown'}
          </h3>

          {conversation.unread_count > 0 && (
            <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-xs text-white">
              {conversation.unread_count}
            </span>
          )}
        </div>

        <p className="mt-1 truncate text-sm text-gray-500">
          {conversation.last_message ??
            'Start the conversation'}
        </p>
      </div>
    </button>
  );
}