// src/features/messages/components/ConversationRow.tsx
import Card from '../../../shared/components/Card';
import type { Conversation } from '../types/messages.types';
import { formatTime } from '../utils/formatTime';

type Props = {
  conversation: Conversation;
  onOpen: () => void;
};

export function ConversationRow({
  conversation,
  onOpen,
}: Props) {
  const profile = conversation.profile ?? {};
  const initial =
    profile.display_name?.charAt(0).toUpperCase() ?? '?';

  const hasUnreadMessages = conversation.unread_count > 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full text-left"
    >
      <Card className="transition-colors hover:bg-[#f8f4ed]">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[#e8e0d0] bg-[#f2ede3]">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-light text-[#b07d6c]">
                  {initial}
                </span>
              )}
            </div>

            {hasUnreadMessages && (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#b07d6c]"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm text-[#141414] ${
                hasUnreadMessages
                  ? 'font-semibold'
                  : 'font-medium'
              }`}
            >
              {profile.display_name ?? 'Unknown'}
            </p>

            <p
              className={`mt-1 truncate text-xs ${
                hasUnreadMessages
                  ? 'font-medium text-[#333333]/75'
                  : 'text-[#333333]/50'
              }`}
            >
              {conversation.last_message ||
                'Start your conversation'}
            </p>
          </div>

          <div className="flex flex-shrink-0 flex-col items-end gap-2">
            {conversation.updated_at && (
              <span
                className={`text-[11px] ${
                  hasUnreadMessages
                    ? 'font-medium text-[#b07d6c]'
                    : 'text-[#333333]/30'
                }`}
              >
                {formatTime(conversation.updated_at)}
              </span>
            )}

            {hasUnreadMessages && (
              <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#141414] px-1.5 text-[10px] font-semibold leading-none text-white">
                {conversation.unread_count > 99
                  ? '99+'
                  : conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      </Card>
    </button>
  );
}