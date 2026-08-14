import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';

const WHITE_LOGO = 'https://iwvdnvryzyvvstahqqqu.supabase.co/storage/v1/object/public/Marketing/beatlogo%20neg.png';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setDone(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      <div className="flex items-center justify-end px-6 py-5 md:px-12">
        <img src={WHITE_LOGO} alt="BEAT" className="h-6" />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-[#c9b48a]/40 flex items-center justify-center mx-auto mb-6">
                <div className="w-5 h-5 rounded-full border-2 border-[#c9b48a]" />
              </div>
              <h2 className="text-2xl font-light text-white mb-3">Password updated</h2>
              <p className="text-white/40 text-sm">
                Your password has been changed. You can now use it to sign in.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h1 className="text-3xl font-light text-white mb-2">Choose a new password</h1>
                <p className="text-white/40 text-sm">Make it something you'll remember — and others won't guess.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-[#c9b48a] transition-colors text-sm pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                    Confirm password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-[#c9b48a] transition-colors text-sm"
                  />
                </div>

                {/* Password strength hint */}
                {password.length > 0 && (
                  <div className="flex gap-1.5">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          passwordStrength(password) > i
                            ? strengthColor(passwordStrength(password))
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                )}

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
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function strengthColor(score: number): string {
  if (score <= 1) return 'bg-red-400';
  if (score === 2) return 'bg-amber-400';
  if (score === 3) return 'bg-yellow-300';
  return 'bg-green-400';
}
