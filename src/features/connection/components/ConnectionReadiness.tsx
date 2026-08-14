import { useState } from 'react';
import { ConnectionInterview, ConnectionResult } from './ConnectionInterview';
import type { StoredConnectionProfile } from '../types/connection.types';

export function ConnectionReadiness({ onCompleted }: { onCompleted: () => void }) {
  const [result, setResult] = useState<StoredConnectionProfile | null>(null);
  return result
    ? <ConnectionResult stored={result} onContinue={onCompleted} />
    : <ConnectionInterview onCompleted={setResult} />;
}
