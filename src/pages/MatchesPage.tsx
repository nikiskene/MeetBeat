// src/pages/MatchesPage.tsx
import { useEffect, useState } from 'react';
import { MessageCircle, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Button from '../shared/components/Button';
import Card from '../shared/components/Card';
import ErrorMessage from '../shared/components/ErrorMessage';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import PageHeader from '../shared/components/PageHeader';

type Match = {
  id: string;
  matched_user_id: string;
  display_name?: string;
  bio?: string;
  city?: string;
  avatar_url?: string;
  created_at?: string;
};

type Props = {
  onOpenConversation: (matchedUserId: string) => void;
};

export default function MatchesPage({ onOpenConversation }: Props) {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    async function loadMatches() {
      setLoading(true);
      setError('');

      const { data, error: matchError } =
        await supabase.rpc('get_my_matches');

      if (matchError) {
        setError(matchError.message);
        setLoading(false);
        return;
      }

      setMatches((data ?? []) as Match[]);
      setLoading(false);
    }

    loadMatches();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 md:px-12">
      <PageHeader eyebrow="Matches" title="People you've connected with" />

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {matches.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8e0d0]">
            <MessageCircle size={22} className="text-[#c9a090]" />
          </div>

          <h2 className="mb-2 text-xl font-light text-[#141414]">
            No matches yet
          </h2>

          <p className="text-sm text-[#333333]/50">
            When both people like each other, the match appears here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {matches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              onOpenConversation={onOpenConversation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({
  match,
  onOpenConversation,
}: {
  match: Match;
  onOpenConversation: (id: string) => void;
}) {
  const initial = match.display_name?.charAt(0).toUpperCase() ?? '?';

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex h-40 items-center justify-center overflow-hidden bg-[#f2ede3]">
        {match.avatar_url ? (
          <img
            src={match.avatar_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-5xl font-light text-[#c9a090]">
            {initial}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-sm font-medium text-[#141414]">
          {match.display_name ?? 'Unknown'}
        </h3>

        {match.city && (
          <div className="mt-1 flex items-center gap-1 text-xs text-[#333333]/40">
            <MapPin size={10} />
            {match.city}
          </div>
        )}

        {match.bio && (
          <p className="mb-3 mt-3 line-clamp-2 text-xs leading-relaxed text-[#333333]/60">
            {match.bio}
          </p>
        )}

        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenConversation(match.matched_user_id)}
        >
          <MessageCircle size={14} />
          Open conversation
        </Button>
      </div>
    </Card>
  );
}