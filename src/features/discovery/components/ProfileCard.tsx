// src/features/discovery/components/ProfileCard.tsx
import { useState } from 'react';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import type { DiscoveryCandidate } from '../services/discovery';

type Props = {
  candidate: DiscoveryCandidate;
  onLike?: (candidateId: string) => Promise<void> | void;
  onSkip?: (candidateId: string) => Promise<void> | void;
};

export function ProfileCard({ candidate, onLike, onSkip }: Props) {
  const [busy, setBusy] = useState(false);

  const location =
    candidate.location_label ??
    [candidate.city, candidate.country].filter(Boolean).join(', ');

  async function handleLike() {
    if (!onLike || busy) return;
    setBusy(true);
    try {
      await onLike(candidate.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleSkip() {
    if (!onSkip || busy) return;
    setBusy(true);
    try {
      await onSkip(candidate.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="mb-4 aspect-square overflow-hidden rounded-xl bg-[#f2ede3]">
        {candidate.avatar_url && (
          <img
            src={candidate.avatar_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <h2 className="text-lg font-medium text-[#141414]">
        {candidate.display_name}
      </h2>

      {location && (
        <p className="mt-1 text-sm text-[#333333]/60">{location}</p>
      )}

      {candidate.relationship_intention && (
        <p className="mt-3 text-xs uppercase tracking-wider text-[#b07d6c]">
          {candidate.relationship_intention}
        </p>
      )}

      {candidate.bio && (
        <p className="mt-3 line-clamp-4 text-sm text-[#333333]">
          {candidate.bio}
        </p>
      )}

      {(onLike || onSkip) && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={handleSkip}
          >
            Skip
          </Button>

          <Button
            type="button"
            disabled={busy}
            onClick={handleLike}
          >
            {busy ? '...' : 'Like'}
          </Button>
        </div>
      )}
    </Card>
  );
}