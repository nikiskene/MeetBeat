import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';

const WHITE_LOGO = 'https://iwvdnvryzyvvstahqqqu.supabase.co/storage/v1/object/public/Marketing/beatlogo%20neg.png';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export default function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      <div className="flex items-center justify-between px-6 py-5 md:px-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <img src={WHITE_LOGO} alt="BEAT" className="h-6" />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                <div className="w-5 h-5 rounded-full border-2 border-[#c9b48a]" />
              </div>
              <h2 className="text-2xl font-light text-white mb-3">Check your inbox</h2>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto">
                If an account exists for <span className="text-white/70">{email}</span>, you'll
                receive a reset link shortly.
              </p>
              <button
                onClick={onBack}
                className="mt-8 text-[#c9b48a] hover:text-[#a8926a] text-sm transition-colors"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h1 className="text-3xl font-light text-white mb-2">Reset your password</h1>
                <p className="text-white/40 text-sm">
                  Enter your email and we'll send you a link to choose a new one.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-[#c9b48a] transition-colors text-sm"
                  />
                </div>

                {error && (
                  <div className="bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#fdfcf9] text-[#141414] py-3.5 rounded-xl font-medium hover:bg-[#f2ede3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
