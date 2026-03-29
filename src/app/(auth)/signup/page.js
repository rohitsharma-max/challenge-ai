// src/app/(auth)/signup/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm]                   = useState({ name: '', email: '', password: '' });
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = () => { setGoogleLoading(true); window.location.href = '/api/auth/google'; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Signup failed'); return; }
      toast.success('OTP sent to your email. Verify to continue.');
      router.push(`/verify-email?email=${encodeURIComponent(data.email || form.email)}`);
    } catch { toast.error('Something went wrong. Please try again.'); }
    finally   { setLoading(false); }
  };

  return (
    <div>
      <h1 className="font-display text-[26px] font-extrabold mb-1.5" style={{ color: 'var(--text-primary)' }}>Create your account</h1>
      <p className="text-[15px] mb-8" style={{ color: 'var(--text-secondary)' }}>Your first challenge is waiting.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {[
          { label: 'Your Name', type: 'text', key: 'name', placeholder: 'Alex' },
          { label: 'Email',     type: 'email', key: 'email', placeholder: 'you@example.com' },
          { label: 'Password',  type: 'password', key: 'password', placeholder: 'Min. 8 characters' },
        ].map(({ label, type, key, placeholder }) => (
          <div key={key} className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold tracking-wide" style={{ color: 'var(--text-secondary)' }}>{label}</label>
            <input type={type} className="input" placeholder={placeholder}
              value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required minLength={key === 'password' ? 8 : undefined} autoFocus={key === 'name'} />
          </div>
        ))}

        <button type="submit" className="btn btn-primary w-full py-4 text-base rounded-2xl mt-2" disabled={loading}>
          {loading ? <><span className="spinner w-4 h-4 border-2" /> Creating account...</> : 'Create Account →'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>or</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <button
        type="button"
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-[15px] font-semibold transition-all duration-200"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        onClick={handleGoogleSignIn} disabled={googleLoading}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-glass-hover)'; e.currentTarget.style.borderColor = 'var(--text-secondary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        {googleLoading ? <><span className="spinner w-4 h-4 border-2" /> Redirecting...</> : <>
          <GoogleIcon /> Sign up with Google
        </>}
      </button>

      <p className="text-center mt-6 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-semibold" style={{ color: 'var(--accent-light)' }}>Log in</Link>
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