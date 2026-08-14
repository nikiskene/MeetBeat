// src/features/messages/components/MessageComposer.tsx

import { useState } from 'react';
import { Send } from 'lucide-react';

type Props = {
  sending?: boolean;
  onSend: (text: string) => Promise<void>;
};

export default function MessageComposer({
  sending = false,
  onSend,
}: Props) {
  const [text, setText] = useState('');

  async function handleSend() {
    const value = text.trim();

    if (!value || sending) return;

    setText('');

    try {
      await onSend(value);
    } catch {
      setText(value);
    }
  }

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-end gap-3">
        <textarea
          rows={1}
          value={text}
          disabled={sending}
          placeholder="Write a message..."
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          className="min-h-[44px] flex-1 resize-none rounded-xl border px-3 py-2 outline-none focus:ring-2"
        />

        <button
          type="button"
          disabled={!text.trim() || sending}
          onClick={() => void handleSend()}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}