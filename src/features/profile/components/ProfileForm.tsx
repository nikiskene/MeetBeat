// src/features/profile/components/ProfileForm.tsx
import React, { useEffect, useState } from 'react';
import { Loader2, LogOut, MapPin, Save } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import ErrorMessage from '../../../shared/components/ErrorMessage';
import Pill from '../../../shared/components/Pill';
import TextInput from '../../../shared/components/TextInput';
import { ProfileGalleryEditor } from './ProfileGalleryEditor';
import type { ProfilePhoto } from '../services/profilePhotos';
import type { Profile } from '../types/profile.types';
import { CONVERSATION_PREFS, INTENTION_OPTIONS } from '../constants/profileOptions';
import { ConnectionProfileSection } from '../../connection/components/ConnectionProfileSection';

type Props = {
  userId: string;
  profile: Profile;
  photos: ProfilePhoto[];
  saving: boolean;
  saved: boolean;
  error: string;
  onChange: (profile: Profile) => void;
  onSave: () => void;
  onSignOut: () => void;
  onPhotosUploaded: () => void;
  onError: (message: string) => void;
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

export function ProfileForm({ userId, profile, photos, saving, saved, error, onChange, onSave, onSignOut, onPhotosUploaded, onError }: Props) {
  const toggleConvPref = (pref: string) => {
    const prefs = profile.conversation_preferences ?? [];
    onChange({ ...profile, conversation_preferences: prefs.includes(pref) ? prefs.filter(x => x !== pref) : [...prefs, pref] });
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-5">
        <TextInput label="Display name" value={profile.display_name ?? ''} onChange={e => onChange({ ...profile, display_name: e.target.value })} placeholder="How should people know you?" />
        <Field label="Bio">
          <textarea value={profile.bio ?? ''} onChange={e => onChange({ ...profile, bio: e.target.value })} placeholder="Tell people who you really are — values, curiosities, what lights you up." rows={4} className={textareaClass} />
        </Field>
        <CityAutocomplete profile={profile} onChange={onChange} />
        <RegionCommunity profile={profile} saved={saved} />
        <TextInput label="Date of birth" type="date" value={profile.birthdate ?? ''} onChange={e => onChange({ ...profile, birthdate: e.target.value })} />
      </Card>

      <Card><Field label="Relationship intention"><div className="flex flex-wrap gap-2">{INTENTION_OPTIONS.map(option => <Pill key={option} active={profile.relationship_intention === option} onClick={() => onChange({ ...profile, relationship_intention: option })}>{option}</Pill>)}</div></Field></Card>
      <Card><Field label="Conversation preferences"><div className="flex flex-wrap gap-2">{CONVERSATION_PREFS.map(pref => <Pill key={pref} active={(profile.conversation_preferences ?? []).includes(pref)} onClick={() => toggleConvPref(pref)}>{pref}</Pill>)}</div></Field></Card>
      <ConnectionProfileSection userId={userId} />
      <Card><Field label="Photos"><ProfileGalleryEditor userId={userId} photos={photos} onUploaded={onPhotosUploaded} onError={onError} /><p className="mt-2 text-xs text-[#333333]/40">Add up to three photos shown to other people.</p></Field></Card>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <div className="flex items-center justify-between border-t border-[#e8e0d0] pt-4">
        <button type="button" onClick={onSignOut} className="flex items-center gap-2 text-sm text-[#333333]/50 transition-colors hover:text-[#141414]"><LogOut size={15} />Sign out</button>
        <Button type="button" onClick={onSave} disabled={saving}><Save size={15} />{saving ? 'Saving…' : saved ? 'Saved!' : 'Save profile'}</Button>
      </div>
    </div>
  );
}

function CityAutocomplete({ profile, onChange }: { profile: Profile; onChange: (profile: Profile) => void }) {
  const [query, setQuery] = useState(profile.city ?? '');
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { setQuery(profile.city ?? ''); }, [profile.city]);

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
      setMessage('');
      try {
        const response = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(value) + '&count=8&language=en&format=json', { signal: controller.signal });
        if (!response.ok) throw new Error('City search is temporarily unavailable.');
        const payload = await response.json() as { results?: CityResult[] };
        const next = payload.results ?? [];
        setResults(next);
        setOpen(true);
        if (!next.length) setMessage('No matching city found. Try a nearby city or a different spelling.');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([]);
          setOpen(true);
          setMessage('City search is temporarily unavailable. You can try again in a moment.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, profile.city, profile.latitude]);

  const selectCity = (city: CityResult) => {
    setQuery(city.name);
    setResults([]);
    setOpen(false);
    setMessage('');
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
  };

  const editQuery = (value: string) => {
    setQuery(value);
    onChange({ ...profile, city: value, country: undefined, region: undefined, latitude: null, longitude: null, location_place_id: null, location_updated_at: null });
  };

  return (
    <div className="relative">
      <label htmlFor="profile-city" className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#333333]/50">City</label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#333333]/40" />
        <input id="profile-city" role="combobox" aria-expanded={open} aria-controls="city-results" aria-autocomplete="list" autoComplete="off" value={query} onChange={event => editQuery(event.target.value)} onFocus={() => results.length && setOpen(true)} placeholder="Start typing your city" className="w-full rounded-xl border border-[#e8e0d0] bg-[#f9f6f0] py-3 pl-10 pr-10 text-sm text-[#141414] outline-none transition-colors placeholder:text-[#333333]/30 focus:border-[#b07d6c]" />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#b07d6c]" />}
      </div>
      {profile.latitude != null && profile.country && <p className="mt-2 text-xs text-emerald-700">Location confirmed: {[profile.city, profile.region, profile.country].filter(Boolean).join(', ')}</p>}
      {open && <div id="city-results" role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-[#e8e0d0] bg-white p-1 shadow-xl">
        {message && <p className="p-3 text-sm text-[#333333]/60">{message}</p>}
        {results.map(city => <button key={city.id} type="button" role="option" aria-selected="false" onMouseDown={event => event.preventDefault()} onClick={() => selectCity(city)} className="w-full rounded-lg px-3 py-2 text-left hover:bg-[#f9f6f0]"><span className="block text-sm font-medium text-[#141414]">{city.name}</span><span className="block text-xs text-[#333333]/50">{[city.admin1, city.country].filter(Boolean).join(', ')}</span></button>)}
      </div>}
      <p className="mt-2 text-xs text-[#333333]/40">Selecting a suggestion lets BEAT calculate regional community totals without showing your precise coordinates.</p>
    </div>
  );
}


function RegionCommunity({ profile, saved }: { profile: Profile; saved: boolean }) {
  const [community, setCommunity] = useState<{ available: boolean; region?: string; country?: string; member_count?: number | null; privacy_threshold_met?: boolean } | null>(null);

  useEffect(() => {
    if (profile.latitude == null || !saved) return;
    let active = true;
    supabase.rpc('get_my_region_community').then(({ data, error }) => {
      if (active && !error) setCommunity(data as typeof community);
    });
    return () => { active = false; };
  }, [profile.latitude, profile.location_updated_at, saved]);

  if (!community?.available) return null;
  return (
    <div className="rounded-xl border border-[#e8e0d0] bg-[#f9f6f0] p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-[#333333]/50">Your regional BEAT community</p>
      {community.privacy_threshold_met ? <p className="mt-1 text-lg font-semibold text-[#141414]">{community.member_count} members in {community.region}, {community.country}</p> : <p className="mt-1 text-sm text-[#333333]/70">Your BEAT community in {community.region}, {community.country} is growing. A count appears once at least three members are present.</p>}
    </div>
  );
}

const textareaClass = 'w-full bg-[#f9f6f0] border border-[#e8e0d0] rounded-xl px-4 py-3 text-[#141414] placeholder-[#333333]/30 focus:outline-none focus:border-[#b07d6c] transition-colors text-sm resize-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#333333]/50">{label}</label>{children}</div>;
}
