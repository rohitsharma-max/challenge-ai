// src/app/onboarding/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './onboarding.module.css';

const CATEGORIES = [
  { id: 'fitness', emoji: '💪', label: 'Fitness', desc: 'Workouts, movement, outdoors' },
  { id: 'productivity', emoji: '⚡', label: 'Productivity', desc: 'Focus, systems, work' },
  { id: 'learning', emoji: '🧠', label: 'Learning', desc: 'Skills, knowledge, growth' },
  { id: 'fun', emoji: '🎉', label: 'Fun', desc: 'Hobbies, creativity, joy' },
  { id: 'social', emoji: '🤝', label: 'Social', desc: 'Relationships, community' },
];

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', emoji: '🌱', desc: '10–20 min challenges', xp: '30 XP' },
  { id: 'medium', label: 'Medium', emoji: '🔥', desc: '30–60 min challenges', xp: '60 XP' },
  { id: 'hard', label: 'Hard', emoji: '💎', desc: '60–120 min challenges', xp: '120 XP' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [allowOutdoor, setAllowOutdoor] = useState(true);
  const [loading, setLoading] = useState(false);

  const toggleCategory = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    if (selected.length === 0) {
      toast.error('Please select at least one category!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: selected, difficulty, allowOutdoor }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Something went wrong');
        return;
      }

      toast.success('All set! Your first challenge awaits 🚀');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.orb} />

      <div className={styles.container}>
        {/* Progress */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${(step / 2) * 100}%` }} />
        </div>
        <p className={styles.stepLabel}>Step {step} of 2</p>

        {step === 1 && (
          <div className={`${styles.stepContent} animate-slide-up`}>
            <div className={styles.stepIcon}>🎯</div>
            <h1 className={styles.title}>What do you want to work on?</h1>
            <p className={styles.subtitle}>Select all that interest you. Your challenges will be personalized.</p>

            <div className={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.categoryCard} ${selected.includes(cat.id) ? styles.selected : ''}`}
                  onClick={() => toggleCategory(cat.id)}
                >
                  <span className={styles.categoryEmoji}>{cat.emoji}</span>
                  <span className={styles.categoryLabel}>{cat.label}</span>
                  <span className={styles.categoryDesc}>{cat.desc}</span>
                  {selected.includes(cat.id) && <span className={styles.checkmark}>✓</span>}
                </button>
              ))}
            </div>

            <button
              className={`btn btn-primary ${styles.nextBtn}`}
              onClick={() => {
                if (selected.length === 0) {
                  toast.error('Pick at least one category!');
                  return;
                }
                setStep(2);
              }}
            >
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className={`${styles.stepContent} animate-slide-up`}>
            <div className={styles.stepIcon}>⚔️</div>
            <h1 className={styles.title}>How hard do you want it?</h1>
            <p className={styles.subtitle}>Start easy and level up, or dive straight into the deep end.</p>

            <div className={styles.difficultyGrid}>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  className={`${styles.difficultyCard} ${difficulty === d.id ? styles.selected : ''}`}
                  onClick={() => setDifficulty(d.id)}
                >
                  <span className={styles.diffEmoji}>{d.emoji}</span>
                  <span className={styles.diffLabel}>{d.label}</span>
                  <span className={styles.diffDesc}>{d.desc}</span>
                  <span className={styles.diffXP}>{d.xp} per day</span>
                  {difficulty === d.id && <span className={styles.checkmark}>✓</span>}
                </button>
              ))}
            </div>

            {/* Outdoor toggle */}
            <div className={styles.toggleSection}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>🌿 Allow outdoor challenges</span>
                <span className={styles.toggleDesc}>Some challenges require going outside</span>
              </div>
              <button
                className={`${styles.toggle} ${allowOutdoor ? styles.toggleOn : ''}`}
                onClick={() => setAllowOutdoor(!allowOutdoor)}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>

            <div className={styles.btnRow}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                className={`btn btn-primary ${styles.nextBtn}`}
                onClick={handleFinish}
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading
                  ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Setting up...</>
                  : '🚀 Let\'s Go!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
