// src/features/discovery/components/MatchFlashOverlay.tsx
import { useEffect } from 'react';

const DESKTOP_MASK =
  'https://iwvdnvryzyvvstahqqqu.supabase.co/storage/v1/object/public/Marketing/Match.png';

const PHONE_MASK =
  'https://iwvdnvryzyvvstahqqqu.supabase.co/storage/v1/object/public/Marketing/Match%20Phones.png';

type Props = {
  leftAvatarUrl?: string | null;
  rightAvatarUrl?: string | null;
  onComplete: () => void;
};

export function MatchFlashOverlay({
  leftAvatarUrl,
  rightAvatarUrl,
  onComplete,
}: Props) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 2000);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <>
      <style>
        {`
          @keyframes beatFade {
            0% { opacity: 0; transform: scale(1.02); }
            16% { opacity: 1; transform: scale(1); }
            84% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(1.015); }
          }

          @keyframes avatarPop {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(1.08); }
            22% { opacity: 1; transform: translate(-50%, -50%) scale(1.16); }
            38% { transform: translate(-50%, -50%) scale(1.12); }
            100% { opacity: 1; transform: translate(-50%, -50%) scale(1.12); }
          }
        `}
      </style>

      <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#080604] animate-[beatFade_2s_ease-in-out_forwards]">
        <AvatarSlot
          avatarUrl={leftAvatarUrl}
          className="left-[39.8%] top-[39.8%] h-[50vw] w-[50vw] md:h-[31vw] md:w-[31vw]"
        />

        <AvatarSlot
          avatarUrl={rightAvatarUrl}
          className="left-[60.2%] top-[39.8%] h-[50vw] w-[50vw] md:h-[31vw] md:w-[31vw]"
        />

        <picture className="absolute inset-0 z-20">
          <source media="(min-width:768px)" srcSet={DESKTOP_MASK} />
          <img
            src={PHONE_MASK}
            alt=""
            className="h-full w-full object-cover"
          />
        </picture>
      </div>
    </>
  );
}

function AvatarSlot({
  avatarUrl,
  className,
}: {
  avatarUrl?: string | null;
  className: string;
}) {
  if (!avatarUrl) return null;

  return (
    <div
      className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full animate-[avatarPop_.7s_ease-out] ${className}`}
    >
      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
    </div>
  );
}