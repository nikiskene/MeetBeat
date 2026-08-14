import { useEffect, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import type { OnboardingProfile } from '../services/onboardingService';
import { ONBOARDING_COPY } from '../constants/onboardingContent';
import { StepShell } from './StepShell';

type CityResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  country_code?: string;
};

type Props = {
  profile: OnboardingProfile;
  onChange: (profile: OnboardingProfile) => void;
  onNext: () => void;
  onBack: () => void;
};

export function LocationStep({ profile, onChange, onNext, onBack }: Props) {
  const copy = ONBOARDING_COPY.location;
  const [query, setQuery] = useState(profile.city ?? '');
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2 || (value === profile.city && profile.latitude != null)) {
      setResults([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&count=8&language=en&format=json`,
          { signal: controller.signal },
        );
        const payload = await res.json() as { results?: CityResult[] };
        setResults(payload.results ?? []);
        setOpen(true);
      } catch {
        /* best-effort */
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, profile.city, profile.latitude]);

  function selectCity(city: CityResult) {
    setQuery(city.name);
    setOpen(false);
    onChange({
      ...profile,
      city: city.name,
      country: city.country,
      region: city.admin1 ?? city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      location_place_id: city.id,
      location_updated_at: new Date().toISOString(),
    });
  }

  const canProceed = profile.latitude != null && Boolean(profile.city);

  return (
    <StepShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      body={copy.body}
      onBack={onBack}
      onNext={onNext}
      canProceed={canProceed}
    >
      <div className="relative">
        <label htmlFor="ob-city" className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#333333]/50">
          City
        </label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#333333]/40" />
          <input
            id="ob-city"
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              onChange({
                ...profile,
                city: e.target.value,
                latitude: null,
                longitude: null,
                location_place_id: null,
              });
            }}
            placeholder="Start typing your city"
            className="w-full rounded-xl border border-[#e8e0d0] bg-[#f9f6f0] py-3.5 pl-10 pr-10 text-sm text-[#141414] outline-none transition focus:border-[#b07d6c]"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#b07d6c]" />}
        </div>
        {open && results.length > 0 && (
          <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-[#e8e0d0] bg-white p-1 shadow-xl">
            {results.map(city => (
              <button
                key={city.id}
                type="button"
                onClick={() => selectCity(city)}
                className="w-full rounded-lg px-3 py-2 text-left hover:bg-[#f9f6f0]"
              >
                <span className="block text-sm font-medium text-[#141414]">{city.name}</span>
                <span className="block text-xs text-[#333333]/50">
                  {[city.admin1, city.country].filter(Boolean).join(', ')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </StepShell>
  );
}
