// src/features/messages/components/ActionMenu.tsx

import { useState } from 'react';
import {
  Ban,
  Flag,
  MoreHorizontal,
  UserMinus,
} from 'lucide-react';

type Props = {
  onBlock: () => void;
  onUnmatch: () => void;
  onReport: () => void;
};

export default function ActionMenu({
  onBlock,
  onUnmatch,
  onReport,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="rounded-full p-2 transition hover:bg-neutral-100"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-xl border bg-white shadow-xl">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onReport();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50"
          >
            <Flag size={16} />
            Report
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onBlock();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50"
          >
            <Ban size={16} />
            Block user
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onUnmatch();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50"
          >
            <UserMinus size={16} />
            Unmatch
          </button>
        </div>
      )}
    </div>
  );
}