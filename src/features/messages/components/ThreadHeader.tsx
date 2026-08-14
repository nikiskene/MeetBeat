// src/features/messages/components/ThreadHeader.tsx

import ActionMenu from './ActionMenu';

type Props = {
  name: string;
  photoUrl?: string | null;
  onBlock: () => void;
  onUnmatch: () => void;
  onReport: () => void;
};

export default function ThreadHeader({
  name,
  photoUrl,
  onBlock,
  onUnmatch,
  onReport,
}: Props) {
  return (
    <header className="flex items-center justify-between border-b bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <h2 className="font-semibold">{name}</h2>
        </div>
      </div>

      <ActionMenu
        onBlock={onBlock}
        onUnmatch={onUnmatch}
        onReport={onReport}
      />
    </header>
  );
}