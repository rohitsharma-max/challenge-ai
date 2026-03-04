// src/app/(auth)/signup/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from '../login/login.module.css';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Signup failed');
        return;
      }

      toast.success('OTP sent to your email. Verify to continue.');
      router.push(`/verify-email?email=${encodeURIComponent(data.email || form.email)}`);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Create your account</h1>
      <p className={styles.subtitle}>Your first challenge is waiting.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Your Name</label>
          <input
            type="text"
            className="input"
            placeholder="Alex"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Password</label>
          <input
            type="password"
            className="input"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          className={`btn btn-primary ${styles.submitBtn}`}
          disabled={loading}
        >
          {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</> : 'Create Account →'}
        </button>
      </form>

      <p className={styles.footer}>
        Already have an account?{' '}
        <Link href="/login" className={styles.link}>Log in</Link>
      </p>
    </div>
  );
}

