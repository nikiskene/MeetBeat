// src/features/messages/pages/MessagesPage.tsx

import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import ErrorMessage from '../../../shared/components/ErrorMessage';
import { ConversationList } from '../components/ConversationList';
import MessageComposer from '../components/MessageComposer';
import ReportDialog from '../components/ReportDialog';
import ThreadHeader from '../components/ThreadHeader';
import { ThreadView } from '../components/ThreadView';
import { useConversations } from '../hooks/useConversations';
import { useMessageActions } from '../hooks/useMessageActions';
import { useRealtime } from '../hooks/useRealtime';
import { useReportDialog } from '../hooks/useReportDialog';
import { useThread } from '../hooks/useThread';
import {
  createMessage,
  createOrOpenConversation,
  fetchConversations,
} from '../services/messageService';
import type {
  Conversation,
  Message,
} from '../types/messages.types';

type Props = {
  openConversationWith?: string | null;
  onClearOpen?: () => void;
};

export default function MessagesPage({
  openConversationWith,
  onClearOpen,
}: Props) {
  const { user } = useAuth();

  const {
    conversations,
    loading,
    error: conversationsError,
    reload,
    removeConversation,
  } = useConversations();

  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const {
    messages,
    loading: loadingMessages,
    error: threadError,
    appendMessage,
    updateMessage,
    replaceMessage,
  } = useThread(activeConversation?.id ?? null);

  const {
    reportOpen,
    openReport,
    closeReport,
  } = useReportDialog();

  const {
    busy,
    handleBlock,
    handleUnmatch,
    handleReport,
  } = useMessageActions({
    matchId: activeConversation?.id ?? '',
    otherUserId:
      activeConversation?.other_user_id ?? '',
    onConversationRemoved: () => {
      if (activeConversation) {
        removeConversation(activeConversation.id);
      }

      setActiveConversation(null);
    },
  });

  const openConversation = useCallback(
    (conversation: Conversation) => {
      setSendError('');
      setActiveConversation(conversation);
    },
    []
  );

  useEffect(() => {
    if (!openConversationWith || !user) {
      return;
    }

    const openRequestedConversation = async () => {
      setSendError('');

      try {
        const conversationId =
          await createOrOpenConversation(
            openConversationWith
          );

        const nextConversations =
          await fetchConversations(user.id);

        const conversation =
          nextConversations.find(
            item => item.id === conversationId
          ) ??
          nextConversations.find(
            item =>
              item.other_user_id ===
              openConversationWith
          );

        if (!conversation) {
          throw new Error(
            'Could not find this conversation.'
          );
        }

        setActiveConversation(conversation);
        await reload();
      } catch (error) {
        setSendError(
          error instanceof Error
            ? error.message
            : 'Could not open conversation.'
        );
      } finally {
        onClearOpen?.();
      }
    };

    void openRequestedConversation();
  }, [
    openConversationWith,
    onClearOpen,
    reload,
    user,
  ]);

  useRealtime({
    userId: user?.id ?? '',
    onInsert: message => {
      if (
        message.match_id === activeConversation?.id
      ) {
        appendMessage(message);
      }

      void reload();
    },
    onUpdate: message => {
      if (
        message.match_id === activeConversation?.id
      ) {
        updateMessage(message);
      }

      void reload();
    },
  });

  const send = async (text: string) => {
    const content = text.trim();

    if (
      !content ||
      !activeConversation ||
      !user ||
      sending
    ) {
      return;
    }

    const temporaryId = `temporary-${Date.now()}`;

    const optimisticMessage: Message = {
      id: temporaryId,
      match_id: activeConversation.id,
      sender_id: user.id,
      type: 'text',
      content,
      created_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
    };

    appendMessage(optimisticMessage);
    setSending(true);
    setSendError('');

    try {
      const savedMessage = await createMessage(
        activeConversation.id,
        user.id,
        content
      );

      replaceMessage(
        temporaryId,
        savedMessage
      );

      await reload();
    } catch (error) {
      setSendError(
        error instanceof Error
          ? error.message
          : 'Could not send message.'
      );
    } finally {
      setSending(false);
    }
  };

  const error =
    sendError ||
    threadError ||
    conversationsError;

  if (activeConversation) {
    return (
      <>
        {error && (
          <div className="px-6 pt-4">
            <ErrorMessage>{error}</ErrorMessage>
          </div>
        )}

        <ThreadHeader
          name={
            activeConversation.profile.display_name ??
            'Unknown'
          }
          photoUrl={
            activeConversation.profile.avatar_url
          }
          onBlock={handleBlock}
          onUnmatch={handleUnmatch}
          onReport={openReport}
        />

        <ThreadView
          conversation={activeConversation}
          messages={messages}
          loading={loadingMessages}
          userId={user?.id}
        />

        <MessageComposer
          sending={sending}
          onSend={send}
        />

        <ReportDialog
          open={reportOpen}
          loading={busy}
          onClose={closeReport}
          onSubmit={handleReport}
        />
      </>
    );
  }

  return (
    <>
      {error && (
        <div className="px-6 pt-4">
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      )}

      <ConversationList
        conversations={conversations}
        loading={loading}
        onOpen={openConversation}
      />
    </>
  );
}