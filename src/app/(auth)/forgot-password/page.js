'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from '../login/login.module.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('request');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to send OTP');
        return;
      }
      toast.success('If your account exists, OTP has been sent.');
      setStep('reset');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || !otp || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to reset password');
        return;
      }

      toast.success('Password reset successful. Please log in.');
      router.push('/login');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Forgot password</h1>
      <p className={styles.subtitle}>
        {step === 'request' ? 'Get OTP on your email to reset password.' : 'Enter OTP and set a new password.'}
      </p>

      {step === 'request' ? (
        <form onSubmit={handleSendOtp} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} /> Sending OTP...
              </>
            ) : (
              'Send OTP'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>OTP</label>
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

          <div className={styles.field}>
            <label className={styles.label}>New password</label>
            <input
              type="password"
              className="input"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Confirm new password</label>
            <input
              type="password"
              className="input"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} /> Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setStep('request')}
            disabled={loading}
          >
            Send OTP again
          </button>
        </form>
      )}

      <p className={styles.footer}>
        Back to <Link href="/login" className={styles.link}>Log in</Link>
      </p>
    </div>
  );
}
