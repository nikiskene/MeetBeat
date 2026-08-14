import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

const WHITE_LOGO = 'https://iwvdnvryzyvvstahqqqu.supabase.co/storage/v1/object/public/Marketing/beatlogo%20neg.png';
const LEGAL_VERSION = '2026.07.23';

interface AuthPageProps {
  mode: 'signin' | 'signup';
  onBack: () => void;
  onToggleMode: () => void;
  onForgotPassword: () => void;
}

export default function AuthPage({ mode, onBack, onToggleMode, onForgotPassword }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [eulaAccepted, setEulaAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (mode === 'signup' && (!ageConfirmed || !privacyAccepted || !eulaAccepted)) {
      setError('Confirm that you are 18 or older and accept the Privacy Policy and EULA.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const acceptedAt = new Date().toISOString();
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              age_confirmed_18: true,
              privacy_accepted: true,
              privacy_version: LEGAL_VERSION,
              eula_accepted: true,
              eula_version: LEGAL_VERSION,
              legal_accepted_at: acceptedAt,
              legal_user_agent: navigator.userAgent,
            },
          },
        });
        if (signUpError) throw signUpError;
        setSuccess('Check your email to confirm your account. Your legal choices were recorded.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const consentClass = 'flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-5 text-white/65';

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      <div className="flex items-center justify-between px-6 py-5 md:px-12">
        <button onClick={onBack} className="flex min-h-11 items-center gap-2 text-sm text-white/50 transition-colors hover:text-white">
          <ArrowLeft size={16} /> Back
        </button>
        <img src={WHITE_LOGO} alt="BEAT" className="h-6" />
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-6 sm:py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 sm:mb-10">
            <h1 className="text-3xl font-light text-white mb-2">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
            <p className="text-white/40 text-sm">{mode === 'signup' ? 'Join BEAT and start meaningful conversations.' : 'Sign in to continue your conversations.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">Email</label>
              <input id="auth-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-white/20 transition-colors focus:border-[#c9b48a] focus:outline-none" />
            </div>

            <div>
              <label htmlFor="auth-password" className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">Password</label>
              <div className="relative">
                <input id="auth-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-sm text-white placeholder-white/20 transition-colors focus:border-[#c9b48a] focus:outline-none" />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}
                  className="absolute right-2 top-1/2 flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center text-white/30 transition-colors hover:text-white/60">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <fieldset className="space-y-2 pt-2">
                <legend className="sr-only">Required legal confirmations</legend>
                <label className={consentClass}>
                  <input type="checkbox" checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)} required className="mt-1 h-4 w-4 shrink-0 accent-[#c9b48a]" />
                  <span>I confirm that I am 18 years of age or older.</span>
                </label>
                <label className={consentClass}>
                  <input type="checkbox" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} required className="mt-1 h-4 w-4 shrink-0 accent-[#c9b48a]" />
                  <span>I acknowledge the <a href="#/privacy" className="text-[#d8c59e] underline underline-offset-2">Privacy Policy and GDPR information</a>.</span>
                </label>
                <label className={consentClass}>
                  <input type="checkbox" checked={eulaAccepted} onChange={e => setEulaAccepted(e.target.checked)} required className="mt-1 h-4 w-4 shrink-0 accent-[#c9b48a]" />
                  <span>I have read and accept the <a href="#/eula" className="text-[#d8c59e] underline underline-offset-2">End User License Agreement</a>.</span>
                </label>
              </fieldset>
            )}

            {mode === 'signin' && (
              <div className="flex justify-end">
                <button type="button" onClick={onForgotPassword} className="min-h-10 text-xs text-white/40 transition-colors hover:text-[#c9b48a]">Forgot password?</button>
              </div>
            )}

            {error && <div role="alert" className="rounded-xl border border-red-500/20 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</div>}
            {success && <div role="status" className="rounded-xl border border-green-500/20 bg-green-900/20 px-4 py-3 text-sm text-green-300">{success}</div>}

            <button type="submit" disabled={loading} className="mt-2 min-h-12 w-full rounded-xl bg-[#fdfcf9] py-3.5 font-medium text-[#141414] transition-colors hover:bg-[#f2ede3] disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-white/30">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={onToggleMode} className="min-h-10 text-[#c9b48a] transition-colors hover:text-[#a8926a]">{mode === 'signup' ? 'Sign in' : 'Join BEAT'}</button>
          </p>
        </div>
      </div>
    </div>
  );
}
