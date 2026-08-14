import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import ErrorMessage from '../../../shared/components/ErrorMessage';
import { ONBOARDING_STEPS, type OnboardingStepId } from '../constants/onboardingContent';
import { useOnboarding } from '../hooks/useOnboarding';
import { OnboardingStepRenderer } from '../components/OnboardingStepRenderer';
import type { OnboardingProfile } from '../services/onboardingService';
import type { DiscoverySettings } from '../../settings/types/settings.types';
import type { MoodWheelOption } from '../../settings/constants/moodWheelOptions';

type Props = { onComplete: () => void; onEditProfile: () => void };
const STEP_ORDER = ONBOARDING_STEPS.map(s => s.id);

export default function OnboardingPage({ onComplete, onEditProfile }: Props) {
  const { user } = useAuth();
  const {
    loading, error, profile, discovery,
    setProfile, setDiscovery, saveProfile, saveDiscovery, saveMoodOptions,
  } = useOnboarding();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [stepError, setStepError] = useState('');

  const currentStep: OnboardingStepId = STEP_ORDER[stepIndex];

  useEffect(() => {
    if (!loading && profile.display_name && stepIndex === 0) {
      const firstIncomplete = STEP_ORDER.findIndex(id => {
        if (id === 'identity') return profile.gender == null;
        if (id === 'name') return !profile.display_name?.trim() || !profile.birthdate;
        if (id === 'location') return profile.latitude == null;
        if (id === 'bio') return !profile.bio?.trim();
        return false;
      });
      if (firstIncomplete > 0) setStepIndex(firstIncomplete);
    }
  }, [loading, profile, stepIndex]);

  async function persistAndAdvance() {
    setStepError(''); setSaving(true);
    try {
      await saveProfile();
      setStepIndex(i => Math.min(i + 1, STEP_ORDER.length - 1));
    } catch (err) {
      setStepError(err instanceof Error ? err.message : 'Could not save.');
    } finally { setSaving(false); }
  }

  async function persistDiscovery() {
    if (!discovery) return;
    setStepError(''); setSaving(true);
    try {
      await saveDiscovery();
      setStepIndex(i => i + 1);
    } catch (err) {
      setStepError(err instanceof Error ? err.message : 'Could not save.');
    } finally { setSaving(false); }
  }

  async function persistMood() {
    setStepError(''); setSaving(true);
    try {
      const opts = (profile.mood_wheel_options ?? []) as MoodWheelOption[];
      await saveMoodOptions(opts);
      setStepIndex(i => i + 1);
    } catch (err) {
      setStepError(err instanceof Error ? err.message : 'Could not save.');
    } finally { setSaving(false); }
  }

  function goNext() {
    if (['identity', 'name', 'location', 'bio', 'photo'].includes(currentStep)) void persistAndAdvance();
    else if (currentStep === 'discovery') void persistDiscovery();
    else if (currentStep === 'mood') void persistMood();
    else setStepIndex(i => Math.min(i + 1, STEP_ORDER.length - 1));
  }

  function goBack() { setStepIndex(i => Math.max(i - 1, 0)); }

  if (loading || !discovery) {
    return <div className="flex min-h-screen items-center justify-center bg-[#fdfcf9]"><LoadingSpinner /></div>;
  }

  const progress = ((stepIndex + 1) / STEP_ORDER.length) * 100;

  return (
    <div className="min-h-screen bg-[#fdfcf9]">
      <div className="mx-auto max-w-2xl px-6 py-8 md:px-12">
        <div className="mb-8 h-1 w-full rounded-full bg-[#e8e0d0]">
          <div className="h-1 rounded-full bg-[#b07d6c] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {(error || stepError) && <div className="mb-6"><ErrorMessage>{error || stepError}</ErrorMessage></div>}
        {saving && <div className="mb-4 text-sm text-[#333333]/50">Saving…</div>}
        <OnboardingStepRenderer
          step={currentStep}
          profile={profile}
          discovery={discovery as DiscoverySettings}
          userId={user?.id}
          onProfileChange={(p: OnboardingProfile) => setProfile(p)}
          onDiscoveryChange={(s: DiscoverySettings) => setDiscovery(s)}
          onAvatar={(url: string) => setProfile({ ...profile, avatar_url: url })}
          onError={setStepError}
          onNext={goNext}
          onBack={goBack}
          onComplete={onComplete}
          onEditProfile={onEditProfile}
        />
      </div>
    </div>
  );
}
