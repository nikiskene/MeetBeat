// src/features/discovery/pages/ExplorePage.tsx

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import ErrorMessage from '../../../shared/components/ErrorMessage';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import PageHeader from '../../../shared/components/PageHeader';
import RetryError from '../../../shared/components/RetryError';
import type { MoodWheelItem } from '../../settings/constants/moodWheelOptions';
import { MatchFlashOverlay } from '../components/MatchFlashOverlay';
import { ProfileCard } from '../components/ProfileCard';
import {
  fetchCandidates,
  recordDiscoveryDecision,
  type DiscoveryCandidate,
} from '../services/discovery';

type Props = {
  onMatch?: (matchedUserId: string) => void;
  beat?: MoodWheelItem;
  onChangeBeat?: () => void;
  embedded?: boolean;
};

export default function ExplorePage({ onMatch, beat, onChangeBeat, embedded = false }: Props) {
  const { user } = useAuth();

  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([]);
  const [matchedCandidate, setMatchedCandidate] =
    useState<DiscoveryCandidate | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState('');
  const [showMatchFlash, setShowMatchFlash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCandidates = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      setCandidates(await fetchCandidates());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load profiles.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void loadCandidates(); }, [loadCandidates]);

  useEffect(() => {
    if (!user) return;

    let isActive = true;

    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (isActive) {
          setCurrentAvatarUrl(data?.avatar_url ?? '');
        }
      });

    return () => {
      isActive = false;
    };
  }, [user]);

  if (!user) return null;

  async function decide(candidateId: string, decision: 'like' | 'skip') {
    setError('');

    try {
      const candidate = candidates.find(profile => profile.id === candidateId);
      const result = await recordDiscoveryDecision(candidateId, decision);

      setCandidates(current =>
        current.filter(profile => profile.id !== candidateId)
      );

      if (result.isMatch && candidate) {
        setMatchedCandidate(candidate);
        setShowMatchFlash(true);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your decision.'
      );
    }
  }

  if (matchedCandidate) {
    return (
      <>
        {showMatchFlash && (
          <MatchFlashOverlay
            leftAvatarUrl={currentAvatarUrl}
            rightAvatarUrl={matchedCandidate.avatar_url}
            onComplete={() => setShowMatchFlash(false)}
          />
        )}

        {!showMatchFlash && (
          <div className="mx-auto max-w-md px-6 py-8">
            <PageHeader
              eyebrow="Match"
              title="It's a beat."
              subtitle={`You and ${matchedCandidate.display_name} liked each other.`}
            />

            <ProfileCard candidate={matchedCandidate} />

            <div className="mt-4">
              <button
                type="button"
                onClick={() => onMatch?.(matchedCandidate.id)}
                className="w-full rounded-full bg-[#141414] px-5 py-3 text-sm font-medium text-white"
              >
                Open conversation
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMatchedCandidate(null)}
              className="mt-3 w-full text-sm text-[#333333]/60"
            >
              Keep exploring
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={embedded ? "w-full" : "mx-auto max-w-5xl px-6 py-8 md:px-12"}>
      <PageHeader
        eyebrow={embedded ? "Today" : "Discover"}
        title={embedded && beat ? `People open to ${beat.label} today` : "Explore"}
        subtitle={
          loading
            ? 'Finding people on your wavelength…'
            : embedded
              ? 'They also fit your current age, gender and distance preferences.'
              : `${candidates.length} eligible ${candidates.length === 1 ? 'profile' : 'profiles'}`
        }
      />

      {error && candidates.length > 0 && <ErrorMessage>{error}</ErrorMessage>}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : error && candidates.length === 0 ? (
        <RetryError message={error} onRetry={loadCandidates} />
      ) : candidates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map(candidate => (
            <ProfileCard
              key={candidate.id}
              candidate={candidate}
              onLike={id => decide(id, 'like')}
              onSkip={id => decide(id, 'skip')}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-[#e8e0d0] bg-white px-6 py-14 text-center shadow-sm">
          <h2 className="text-xl font-light text-[#141414]">No one nearby has chosen this BEAT yet.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#333333]/60">
            Try another BEAT, adjust your discovery preferences or check again later.
          </p>
          {onChangeBeat && (
            <button type="button" onClick={onChangeBeat} className="mt-6 rounded-full bg-[#171513] px-6 py-3 text-sm font-medium text-white">
              Choose another BEAT
            </button>
          )}
        </div>
      )}
    </div>
  );
}
