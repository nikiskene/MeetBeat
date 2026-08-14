import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Eye,
  Flag,
  Image,
  Loader2,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import {
  fetchDesignSnapshot,
  saveDesignSetting,
  saveFeatureFlag,
  saveHomepageSlides,
  type DesignSetting,
  type FeatureFlag,
} from '../features/admin/services/adminDesign';

type Props = { onBack: () => void };

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const stringifyValue = (value: unknown) => typeof value === 'string' ? value : JSON.stringify(value, null, 2);

export default function AdminDesignPage({ onBack }: Props) {
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [logos, setLogos] = useState<Array<{ name: string; url: string; surface: string }>>([]);
  const [settings, setSettings] = useState<DesignSetting[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [newFlagName, setNewFlagName] = useState('');
  const [newFlagDescription, setNewFlagDescription] = useState('');
  const [settingsUnavailableReason, setSettingsUnavailableReason] = useState<string | null>(null);
  const [newImage, setNewImage] = useState('');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchDesignSnapshot()
      .then(snapshot => {
        if (!active) return;
        setHeroImages(snapshot.heroImages);
        setOriginalImages(snapshot.heroImages);
        setLogos(snapshot.logos);
        setSettings(snapshot.settings);
        setFeatureFlags(snapshot.featureFlags);
        setSettingsUnavailableReason(snapshot.settingsUnavailableReason);
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load design data.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const dirty = useMemo(() => JSON.stringify(heroImages) !== JSON.stringify(originalImages), [heroImages, originalImages]);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= heroImages.length) return;
    setHeroImages(current => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setPreviewIndex(target);
  };

  const addImage = () => {
    const value = newImage.trim();
    if (!value) return;
    setHeroImages(current => [...current, value]);
    setPreviewIndex(heroImages.length);
    setNewImage('');
  };

  const persistSlides = async () => {
    setSaving(true); setError(null); setNotice(null);
    try { await saveHomepageSlides(heroImages); setOriginalImages(heroImages); setNotice('Homepage slideshow saved.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save slideshow.'); }
    finally { setSaving(false); }
  };

  const editSetting = async (setting: DesignSetting) => {
    const next = window.prompt(`Edit JSON for ${setting.key}`, stringifyValue(setting.value));
    if (next === null) return;
    try {
      const value = JSON.parse(next);
      await saveDesignSetting(setting.key, value);
      setSettings(current => current.map(item => item.key === setting.key ? { ...item, value, updatedAt: new Date().toISOString() } : item));
      setNotice(`${setting.key} saved.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Setting must be valid JSON.'); }
  };

  const persistFlag = async (name: string, description: string, enabled: boolean) => {
    setSaving(true); setError(null); setNotice(null);
    try {
      const result = await saveFeatureFlag(name, description, enabled);
      const saved: FeatureFlag = { id: result.id, name: result.name, description: result.description, enabled: result.enabled, updatedAt: result.updated_at ?? new Date().toISOString() };
      setFeatureFlags(current => [...current.filter(flag => flag.name !== name), saved].sort((a, b) => a.name.localeCompare(b.name)));
      setNewFlagName(''); setNewFlagDescription(''); setNotice(`Feature flag ${name} saved.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save feature flag.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex min-h-72 items-center justify-center gap-3 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading Design Center…</div>;

  if (error && heroImages.length === 0 && settings.length === 0 && featureFlags.length === 0) return <div className="space-y-4"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-pink-600"><ArrowLeft className="h-4 w-4" /> Back to Admin</button><div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700"><AlertTriangle className="mx-auto h-8 w-8" /><p className="mt-3 font-semibold">Unable to load Design Center</p><p className="mt-1 text-sm">{error}</p></div></div>;

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 font-medium text-pink-600 hover:text-pink-700"><ArrowLeft className="h-4 w-4" /> Admin</button><span>/</span><span>Design</span></nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold text-slate-900">Design Center</h1><p className="mt-1 text-sm text-slate-500">Review existing landing assets and prepare configuration changes.</p></div><div className="flex gap-2"><button type="button" onClick={() => { setHeroImages(originalImages); setPreviewIndex(0); }} disabled={!dirty} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40"><RotateCcw className="h-4 w-4" /> Reset draft</button><button type="button" onClick={persistSlides} disabled={!dirty || saving} className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}</button></div></div>

      {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{notice}</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-2"><Image className="h-5 w-5 text-pink-600" /><h2 className="font-semibold text-slate-900">Homepage slideshow</h2></div><p className="mt-1 text-sm text-slate-500">Reorder, remove or stage image URLs in this local draft.</p></header><div className="divide-y divide-slate-100">{heroImages.map((url, index) => <div key={`${url}-${index}`} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><button type="button" onClick={() => setPreviewIndex(index)} className="h-20 w-full overflow-hidden rounded-xl bg-slate-100 sm:w-28"><img src={url} alt={`Hero ${index + 1}`} className="h-full w-full object-cover" /></button><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">Slide {index + 1}</p><p className="mt-1 truncate text-xs text-slate-400">{url}</p></div><div className="flex gap-2"><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move slide ${index + 1} up`} className="rounded-lg border border-slate-200 p-2 text-slate-500 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => move(index, 1)} disabled={index === heroImages.length - 1} aria-label={`Move slide ${index + 1} down`} className="rounded-lg border border-slate-200 p-2 text-slate-500 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => { setHeroImages(current => current.filter((_, itemIndex) => itemIndex !== index)); setPreviewIndex(0); }} aria-label={`Remove slide ${index + 1}`} className="rounded-lg border border-red-100 p-2 text-red-500"><Trash2 className="h-4 w-4" /></button></div></div>)}{heroImages.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No slideshow images in this draft.</div>}</div><div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row"><input value={newImage} onChange={event => setNewImage(event.target.value)} placeholder="https://… image URL" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-400" /><button type="button" onClick={addImage} disabled={!newImage.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"><Plus className="h-4 w-4" /> Add to draft</button></div></div>
        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm"><div className="flex items-center gap-2 border-b border-white/10 px-5 py-4 text-sm font-semibold text-white"><Eye className="h-4 w-4 text-pink-300" /> Slideshow preview</div><div className="aspect-[4/5] bg-slate-900">{heroImages[previewIndex] ? <img src={heroImages[previewIndex]} alt="Selected slideshow preview" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-slate-400">No image selected</div>}</div><div className="flex flex-wrap gap-2 p-4">{heroImages.map((_, index) => <button key={index} type="button" onClick={() => setPreviewIndex(index)} className={`h-2.5 rounded-full transition ${previewIndex === index ? 'w-8 bg-pink-400' : 'w-2.5 bg-white/30'}`} aria-label={`Preview slide ${index + 1}`} />)}</div></aside>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Palette className="h-5 w-5 text-pink-600" /><h2 className="font-semibold text-slate-900">Logos and landing assets</h2></div><div className="mt-4 grid gap-4 sm:grid-cols-2">{logos.map(logo => <article key={logo.name} className={`rounded-2xl border border-slate-200 p-5 ${logo.name.includes('White') ? 'bg-slate-900' : 'bg-slate-50'}`}><div className="flex h-24 items-center justify-center"><img src={logo.url} alt={logo.name} className="max-h-16 max-w-[220px] object-contain" /></div><div className={`mt-4 ${logo.name.includes('White') ? 'text-white' : 'text-slate-900'}`}><p className="font-semibold">{logo.name}</p><p className={`mt-1 text-sm ${logo.name.includes('White') ? 'text-slate-300' : 'text-slate-500'}`}>{logo.surface}</p><p className="mt-2 truncate text-xs opacity-50">{logo.url}</p></div></article>)}</div></section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-2"><Flag className="h-5 w-5 text-pink-600" /><h2 className="font-semibold text-slate-900">Configuration</h2></div></header>
        {settingsUnavailableReason ? <div className="p-6 text-sm text-slate-600"><p className="font-semibold text-slate-800">Configuration values unavailable</p><p className="mt-1">{settingsUnavailableReason}</p></div> : settings.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No stored configuration values were found.</div> : <div className="divide-y divide-slate-100">{settings.map(setting => <div key={setting.key} className="grid gap-2 p-5 sm:grid-cols-[minmax(160px,0.35fr)_minmax(0,1fr)_auto] sm:items-start"><div><p className="font-semibold text-slate-800">{setting.key}</p><p className="mt-1 text-xs text-slate-400">Updated {formatDate(setting.updatedAt)}</p></div><pre className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{stringifyValue(setting.value)}</pre><button type="button" onClick={() => editSetting(setting)} className="text-sm font-semibold text-pink-600 hover:text-pink-700">Edit</button></div>)}</div>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-2"><Flag className="h-5 w-5 text-purple-600" /><h2 className="font-semibold text-slate-900">Feature flags</h2></div><p className="mt-1 text-sm text-slate-500">Create and toggle guarded production flags.</p></header>
        {featureFlags.length ? <div className="divide-y divide-slate-100">{featureFlags.map(flag => <div key={flag.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-800">{flag.name}</p><p className="mt-1 text-sm text-slate-500">{flag.description || 'No description'}</p><p className="mt-1 text-xs text-slate-400">Updated {formatDate(flag.updatedAt)}</p></div><button type="button" role="switch" aria-checked={flag.enabled} disabled={saving} onClick={() => persistFlag(flag.name, flag.description, !flag.enabled)} className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold ${flag.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'} disabled:opacity-50`}>{flag.enabled ? 'Enabled' : 'Disabled'}</button></div>)}</div> : <div className="p-6 text-sm text-slate-500">No feature flags exist yet. Add one below when a controlled rollout is needed.</div>}
        <div className="grid gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:grid-cols-[minmax(160px,0.4fr)_minmax(0,1fr)_auto]">
          <input value={newFlagName} onChange={event => setNewFlagName(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="feature_name" aria-label="Feature flag name" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-400" />
          <input value={newFlagDescription} onChange={event => setNewFlagDescription(event.target.value)} placeholder="What this flag controls" aria-label="Feature flag description" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-400" />
          <button type="button" disabled={!/^[a-z][a-z0-9_]*$/.test(newFlagName) || saving} onClick={() => persistFlag(newFlagName, newFlagDescription, false)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"><Plus className="h-4 w-4" /> Add flag</button>
        </div>
      </section>
    </div>
  );
}
