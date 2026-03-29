'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || !otp) {
      toast.error('Email and OTP are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Verification failed');
        return;
      }

      toast.success('Email verified successfully.');
      if (data.user?.onboardingComplete) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Enter your email first');
      return;
    }
    setResending(true);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to resend OTP');
        return;
      }
      toast.success('OTP sent again.');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-[26px] font-extrabold mb-1.5" style={{ color: 'var(--text-primary)' }}>Verify your email</h1>
      <p className="text-[15px] mb-8" style={{ color: 'var(--text-secondary)' }}>Enter the 6-digit code sent to your email.</p>

      <form onSubmit={handleVerify} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold tracking-wide" style={{ color: 'var(--text-secondary)' }}>Email</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold tracking-wide" style={{ color: 'var(--text-secondary)' }}>OTP</label>
          <input
            type="text"
            className="input"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            inputMode="numeric"
            maxLength={6}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full py-4 text-base rounded-2xl mt-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16 }} /> Verifying...
            </>
          ) : (
            'Verify Email'
          )}
        </button>
      </form>

      <p className="text-center mt-6 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
        Did not receive OTP?{' '}
        <button
          type="button"
          className="font-semibold"
          onClick={handleResend}
          disabled={resending}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent-light)' }}
        >
          {resending ? 'Sending...' : 'Resend code'}
        </button>
      </p>

      <p className="text-center mt-4 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
        Already verified? <Link href="/login" className="font-semibold" style={{ color: 'var(--accent-light)' }}>Log in</Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
