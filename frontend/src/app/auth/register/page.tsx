'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    try {
      await register(name, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 -right-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 -left-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>
      <div className="w-full max-w-md px-6 relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold">CS</div>
            <span className="font-bold text-xl gradient-text">CodeSync AI</span>
          </Link>
          <h1 className="text-2xl font-black text-white">Create your workspace</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Join thousands of engineers coding smarter</p>
        </div>

        <div className="glass-elevated rounded-2xl p-8 space-y-5">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-rose-400 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Full Name</label>
              <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Johnson" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email address</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" className="input-field" />
            </div>
            <button type="submit" disabled={isLoading} id="register-btn" className="btn-primary w-full py-3 text-base mt-2 disabled:opacity-60">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Creating account...
                </span>
              ) : 'Create Account →'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
            <div className="relative flex justify-center text-xs text-[var(--text-muted)]">
              <span className="px-3 bg-[var(--bg-elevated)]">Already have an account?</span>
            </div>
          </div>
          <Link href="/auth/login" id="login-link" className="btn-secondary w-full py-3 text-center text-sm block">Sign in</Link>
        </div>
        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          By registering, you agree to our <span className="text-[var(--text-secondary)]">Terms of Service</span> and <span className="text-[var(--text-secondary)]">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
