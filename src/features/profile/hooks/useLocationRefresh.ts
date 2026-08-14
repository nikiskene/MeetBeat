import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

const REFRESH_INTERVAL_MS = 5 * 24 * 60 * 60 * 1000;

type ReverseLocation = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
  countryCode?: string;
};

type CityResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  country_code?: string;
};

export function useLocationRefresh(userId?: string) {
  useEffect(() => {
    if (!userId || !navigator.geolocation) return;
    let active = true;
    const attemptKey = `beat:location-refresh-attempt:${userId}`;

    const refresh = async () => {
      const { data, error } = await supabase.from('profiles').select('location_updated_at').eq('id', userId).maybeSingle();
      if (!active || error) return;
      const serverUpdatedAt = data?.location_updated_at ? new Date(data.location_updated_at).getTime() : 0;
      const localAttemptAt = Number(window.localStorage.getItem(attemptKey) ?? 0);
      if (Date.now() - Math.max(serverUpdatedAt, localAttemptAt) < REFRESH_INTERVAL_MS) return;

      window.localStorage.setItem(attemptKey, String(Date.now()));
      try {
        const position = await getCurrentPosition();
        if (!active) return;
        const reverseResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`,
        );
        if (!reverseResponse.ok) return;
        const reverse = await reverseResponse.json() as ReverseLocation;
        const cityName = reverse.city ?? reverse.locality;
        if (!cityName) return;

        const cityResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=10&language=en&format=json`,
        );
        if (!cityResponse.ok) return;
        const cityPayload = await cityResponse.json() as { results?: CityResult[] };
        const countryCode = reverse.countryCode?.toUpperCase();
        const city = cityPayload.results?.find(result => !countryCode || result.country_code?.toUpperCase() === countryCode) ?? cityPayload.results?.[0];
        if (!active || !city) return;

        await supabase.from('profiles').update({
          city: city.name,
          country: city.country ?? reverse.countryName ?? null,
          region: city.admin1 ?? reverse.principalSubdivision ?? city.name,
          latitude: city.latitude,
          longitude: city.longitude,
          location_place_id: city.id,
          location_label: [city.name, city.country ?? reverse.countryName].filter(Boolean).join(', '),
          location_updated_at: new Date().toISOString(),
        }).eq('id', userId);
      } catch {
        // Location refresh is intentionally best-effort and never blocks access.
      }
    };

    void refresh();
    return () => { active = false; };
  }, [userId]);
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
    enableHighAccuracy: false,
    timeout: 10_000,
    maximumAge: 60 * 60 * 1000,
  }));
}
