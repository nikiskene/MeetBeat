// src/features/messages/hooks/useReportDialog.ts

import { useState } from 'react';

export function useReportDialog() {
  const [open, setOpen] = useState(false);

  const show = () => setOpen(true);

  const hide = () => setOpen(false);

  return {
    reportOpen: open,
    openReport: show,
    closeReport: hide,
  };
}