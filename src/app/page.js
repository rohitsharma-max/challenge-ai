// src/app/page.js
'use client';

import Link from 'next/link';

const FEATURES = [
  { icon: '🎯', title: 'Daily Personalized Challenges', desc: 'One unique challenge per day, tailored to your interests and difficulty level.' },
  { icon: '🔥', title: 'Streak System',                 desc: 'Build momentum and track your consistency. Miss a day? Restore with XP.' },
  { icon: '⭐', title: 'XP & Rewards',                  desc: 'Earn XP for every challenge completed. Harder challenges = more XP.' },
  { icon: '📊', title: 'Track Your Progress',           desc: 'Full history of your completed challenges and your growth over time.' },
];

const CATEGORIES = [
  { emoji: '💪', label: 'Fitness' },
  { emoji: '🧠', label: 'Learning' },
  { emoji: '⚡', label: 'Productivity' },
  { emoji: '🎉', label: 'Fun' },
  { emoji: '🤝', label: 'Social' },
];

const STATS = [
  { value: '21', label: 'Day avg streak' },
  { value: '5',  label: 'Categories' },
  { value: '3',  label: 'Difficulty levels' },
  { value: '∞',  label: 'Growth potential' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Orbs */}
      <div className="fixed pointer-events-none z-0" style={{ top: -200, left: -200, width: 600, height: 600, background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
      <div className="fixed pointer-events-none z-0" style={{ top: '40%', right: -150, width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)' }} />
      <div className="fixed pointer-events-none z-0" style={{ bottom: -100, left: '30%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-10 py-5"
        style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 font-display font-bold text-[18px]" style={{ color: 'var(--text-primary)' }}>
          <span className="text-[22px]">⚡</span>
          <span>Streakify</span>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/login" className="btn btn-ghost px-5 py-2.5 text-sm">Log in</Link>
          <Link href="/signup" className="btn btn-primary px-5 py-2.5 text-sm">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 text-center px-6 pt-24 pb-16 max-w-[800px] mx-auto">
        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] mb-8 animate-fade-in"
          style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <span>🔥</span> 10,000+ challenges completed today
        </div>

        <h1 className="font-display font-extrabold leading-[1.1] mb-6 animate-slide-up delay-100"
          style={{ fontSize: 'clamp(42px, 7vw, 80px)', color: 'var(--text-primary)' }}>
          One challenge.<br />Every day.<br />
          <span style={{ background: 'linear-gradient(135deg, var(--accent-light), #ff6b35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Build for life.
          </span>
        </h1>

        <p className="text-[18px] leading-relaxed max-w-[520px] mx-auto mb-10 animate-slide-up delay-200"
          style={{ color: 'var(--text-secondary)' }}>
          Get one AI-personalized challenge every morning. Complete it, earn XP, build your streak.
          Small wins that compound into extraordinary results.
        </p>

        <div className="flex flex-wrap gap-4 justify-center mb-16 animate-slide-up delay-300">
          <Link href="/signup" className="btn btn-primary px-8 py-4 text-base rounded-2xl">
            Start Your Streak — Free
          </Link>
          <Link href="/login" className="btn btn-ghost px-8 py-4 text-base rounded-2xl">
            I already have an account
          </Link>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap justify-center gap-10 px-10 py-7 rounded-3xl animate-fade-in delay-400"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {STATS.map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="font-display text-3xl font-extrabold" style={{ color: 'var(--accent-light)' }}>{s.value}</span>
              <span className="text-[12px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="relative z-10 max-w-[1000px] mx-auto px-6 py-16 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-5" style={{ color: 'var(--text-muted)' }}>
          CHALLENGE CATEGORIES
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {CATEGORIES.map(cat => (
            <div key={cat.label}
              className="flex items-center gap-2 px-5 py-3 rounded-full text-[15px] font-medium transition-all duration-200"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span>{cat.emoji}</span><span>{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 max-w-[1000px] mx-auto px-6 py-16 text-center">
        <h2 className="font-display font-extrabold mb-12"
          style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--text-primary)' }}>
          Everything you need to build better habits
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map(f => (
            <div key={f.title}
              className="p-7 rounded-3xl text-left transition-all duration-200"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(124,58,237,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-display text-[17px] font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 px-6 py-16 text-center">
        <div className="max-w-[600px] mx-auto px-8 sm:px-12 py-16 rounded-3xl"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(159,91,255,0.06))', border: '1px solid rgba(124,58,237,0.25)' }}>
          <h2 className="font-display text-4xl font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>Ready to start?</h2>
          <p className="mb-8 text-base" style={{ color: 'var(--text-secondary)' }}>Your first challenge is waiting. It takes 30 seconds to set up.</p>
          <Link href="/signup" className="btn btn-primary px-10 py-4 text-[17px] rounded-2xl">
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center px-6 py-10 pb-12" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-center gap-2 font-display font-bold text-base mb-2" style={{ color: 'var(--text-primary)' }}>
          <span>⚡</span><span>Streakify</span>
        </div>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Built to help you grow, one day at a time.</p>
      </footer>
    </div>
  );
}