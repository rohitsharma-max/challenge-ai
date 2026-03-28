// src/app/page.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './landing.module.css';

export default function LandingPage() {
  const features = [
    { icon: '🎯', title: 'Daily Personalized Challenges', desc: 'One unique challenge per day, tailored to your interests and difficulty level.' },
    { icon: '🔥', title: 'Streak System', desc: 'Build momentum and track your consistency. Miss a day? Restore with XP.' },
    { icon: '⭐', title: 'XP & Rewards', desc: 'Earn XP for every challenge completed. Harder challenges = more XP.' },
    { icon: '📊', title: 'Track Your Progress', desc: 'Full history of your completed challenges and your growth over time.' },
  ];

  const categories = [
    { emoji: '💪', label: 'Fitness' },
    { emoji: '🧠', label: 'Learning' },
    { emoji: '⚡', label: 'Productivity' },
    { emoji: '🎉', label: 'Fun' },
    { emoji: '🤝', label: 'Social' },
  ];

  return (
    <div className={styles.page}>
      {/* Background orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span>Streakify</span>
        </div>
        <div className={styles.navActions}>
          <Link href="/login" className="btn btn-ghost" style={{ padding: '10px 20px', fontSize: '14px' }}>
            Log in
          </Link>
          <Link href="/signup" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span>🔥</span> 10,000+ challenges completed today
        </div>
        <h1 className={styles.heroTitle}>
          One challenge.<br />
          Every day.<br />
          <span className={styles.heroAccent}>Build for life.</span>
        </h1>
        <p className={styles.heroDesc}>
          Get one AI-personalized challenge every morning. Complete it, earn XP, build your streak.
          Small wins that compound into extraordinary results.
        </p>
        <div className={styles.heroActions}>
          <Link href="/signup" className={`btn btn-primary ${styles.heroBtn}`}>
            Start Your Streak — Free
          </Link>
          <Link href="/login" className={`btn btn-ghost ${styles.heroBtn}`}>
            I already have an account
          </Link>
        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          {[
            { value: '21', label: 'Day avg streak' },
            { value: '5', label: 'Categories' },
            { value: '3', label: 'Difficulty levels' },
            { value: '∞', label: 'Growth potential' },
          ].map((stat) => (
            <div key={stat.label} className={styles.statItem}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>CHALLENGE CATEGORIES</p>
        <div className={styles.categories}>
          {categories.map((cat) => (
            <div key={cat.label} className={styles.categoryPill}>
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Everything you need to build better habits</h2>
        <div className={styles.featureGrid}>
          {features.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>Ready to start?</h2>
          <p className={styles.ctaDesc}>Your first challenge is waiting. It takes 30 seconds to set up.</p>
          <Link href="/signup" className={`btn btn-primary ${styles.ctaBtn}`}>
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.logo} style={{ justifyContent: 'center' }}>
          <span className={styles.logoIcon}>⚡</span>
          <span>Streakify</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>
          Built to help you grow, one day at a time.
        </p>
      </footer>
    </div>
  );
}
