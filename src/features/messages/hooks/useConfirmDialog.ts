// src/features/messages/hooks/useConfirmDialog.ts

import { useState } from 'react';

export function useConfirmDialog() {
  const [open, setOpen] = useState(false);

  const show = () => setOpen(true);

  const hide = () => setOpen(false);

  return {
    confirmOpen: open,
    openConfirm: show,
    closeConfirm: hide,
  };
}