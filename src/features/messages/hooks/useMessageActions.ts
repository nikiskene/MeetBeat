// src/features/messages/hooks/useMessageActions.ts

import { useState } from 'react';
import {
  blockUser,
  reportUser,
  unmatchUser,
} from '../services/moderationService';
import type { ReportReason } from '../types/messages.types';

type Props = {
  matchId: string;
  otherUserId: string;
  onConversationRemoved?: () => void;
};

export function useMessageActions({
  matchId,
  otherUserId,
  onConversationRemoved,
}: Props) {
  const [busy, setBusy] = useState(false);

  async function handleBlock() {
    if (busy || !otherUserId) return;

    const confirmed = window.confirm(
      'Block this person? They will no longer be able to contact you.'
    );

    if (!confirmed) return;

    setBusy(true);

    try {
      await blockUser(otherUserId);
      onConversationRemoved?.();
      window.alert('This person has been blocked.');
    } catch (error) {
      console.error('Could not block user.', error);

      window.alert(
        error instanceof Error
          ? error.message
          : 'Could not block this person.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleUnmatch() {
    if (busy || !matchId) return;

    const confirmed = window.confirm(
      'Remove this match permanently?'
    );

    if (!confirmed) return;

    setBusy(true);

    try {
      await unmatchUser(matchId);
      onConversationRemoved?.();
      window.alert('The match has been removed.');
    } catch (error) {
      console.error('Could not remove match.', error);

      window.alert(
        error instanceof Error
          ? error.message
          : 'Could not remove this match.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleReport(
    reason: ReportReason,
    details: string
  ) {
    if (busy || !matchId) return;

    setBusy(true);

    try {
      await reportUser(
        matchId,
        reason,
        details
      );

      window.alert(
        'Your report has been submitted.'
      );
    } catch (error) {
      console.error('Could not submit report.', error);

      window.alert(
        error instanceof Error
          ? error.message
          : 'Could not submit your report.'
      );

      throw error;
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    handleBlock,
    handleUnmatch,
    handleReport,
  };
}