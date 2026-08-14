// src/features/messages/components/ConversationList.tsx
import { Send } from 'lucide-react';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import PageHeader from '../../../shared/components/PageHeader';
import { ConversationRow } from './ConversationRow';
import type { Conversation } from '../types/messages.types';

type Props = {
  conversations: Conversation[];
  loading: boolean;
  onOpen: (conversation: Conversation) => void;
};

export function ConversationList({
  conversations,
  loading,
  onOpen,
}: Props) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8 md:px-12">
      <PageHeader
        eyebrow="Messages"
        title="Your conversations"
      />

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-3xl bg-[#f2ede3] p-12 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8e0d0]">
            <Send size={20} className="text-[#c9a090]" />
          </div>

          <h2 className="mb-2 text-xl font-light text-[#141414]">
            No conversations yet
          </h2>

          <p className="text-sm text-[#333333]/50">
            When two people like each other, the conversation appears here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(conversation => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              onOpen={() => onOpen(conversation)}
            />
          ))}
        </div>
      )}
    </div>
  );
}