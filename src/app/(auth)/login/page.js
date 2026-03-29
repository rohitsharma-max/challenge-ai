// src/app/(auth)/login/page.js
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm]             = useState({ email: '', password: '' });
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      const messages = {
        google_auth_failed: 'Google sign-in was cancelled or failed.',
        invalid_state: 'Invalid OAuth state. Please try again.',
        token_exchange_failed: 'Failed to authenticate with Google.',
        userinfo_failed: 'Could not retrieve Google account info.',
        server_error: 'Something went wrong. Please try again.',
      };
      toast.error(messages[error] || 'Authentication failed.');
    }
  }, [searchParams]);

  const handleGoogleSignIn = () => { setGoogleLoading(true); window.location.href = '/api/auth/google'; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresVerification && data.email) {
          toast.error(data.error || 'Please verify your email first.');
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }
        toast.error(data.error || 'Login failed');
        return;
      }
      toast.success('Welcome back! 🔥');
      router.push(data.user.onboardingComplete ? '/dashboard' : '/onboarding');
    } catch { toast.error('Something went wrong. Please try again.'); }
    finally   { setLoading(false); }
  };

  return (
    <div>
      <h1 className="font-display text-[26px] font-extrabold mb-1.5" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
      <p className="text-[15px] mb-8" style={{ color: 'var(--text-secondary)' }}>Pick up where you left off.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold tracking-wide" style={{ color: 'var(--text-secondary)' }}>Email</label>
          <input type="email" className="input" placeholder="you@example.com"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required autoFocus />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold tracking-wide" style={{ color: 'var(--text-secondary)' }}>Password</label>
          <input type="password" className="input" placeholder="••••••••"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm font-semibold transition-all duration-200"
              style={{ color: 'var(--accent-light)' }}
              onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}>
              Forgot password?
            </Link>
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full py-4 text-base rounded-2xl mt-2" disabled={loading}>
          {loading ? <><span className="spinner w-4 h-4 border-2" /> Logging in...</> : 'Log in →'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>or</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {/* Google */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-[15px] font-semibold transition-all duration-200"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-glass-hover)'; e.currentTarget.style.borderColor = 'var(--text-secondary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)';         e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        {googleLoading
          ? <><span className="spinner w-4 h-4 border-2" /> Redirecting...</>
          : <>
              <GoogleIcon />
              Continue with Google
            </>}
      </button>

      <p className="text-center mt-6 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
        Don't have an account?{' '}
        <Link href="/signup" className="font-semibold transition-all duration-200"
          style={{ color: 'var(--accent-light)' }}>
          Create one free
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}