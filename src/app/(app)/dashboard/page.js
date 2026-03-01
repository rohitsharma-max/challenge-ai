// src/app/(app)/dashboard/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import styles from './dashboard.module.css';

const CATEGORY_EMOJIS = {
  fitness: '💪',
  productivity: '⚡',
  learning: '🧠',
  fun: '🎉',
  social: '🤝',
};

const DIFFICULTY_COLORS = {
  easy: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Easy' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Medium' },
  hard: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Hard' },
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const fileRef = useRef();

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setData(json);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setProofFile(file);
    const url = URL.createObjectURL(file);
    setProofPreview(url);
  };

  const fireConfetti = () => {
    const count = 200;
    const defaults = { origin: { y: 0.7 }, zIndex: 9999 };

    const fire = (particleRatio, opts) => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    };

    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#7c3aed', '#9f5bff'] });
    fire(0.2, { spread: 60, colors: ['#ff6b35', '#fbbf24'] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#10b981', '#34d399'] });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#fff', '#f0f0f8'] });
    fire(0.1, { spread: 120, startVelocity: 45, colors: ['#7c3aed', '#ff6b35'] });
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      let res;
      if (proofFile) {
        const formData = new FormData();
        formData.append('proof', proofFile);
        res = await fetch('/api/challenges/complete', { method: 'POST', body: formData });
      } else {
        res = await fetch('/api/challenges/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
      }

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Failed to complete challenge');
        return;
      }

      // Trigger celebration
      setShowCelebration(true);
      fireConfetti();

      setTimeout(() => {
        setShowCelebration(false);
        fetchDashboard();
      }, 3500);

      toast.success(`🎉 +${result.xpEarned} XP earned! Streak: ${result.newStreak} 🔥`);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setCompleting(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm(`Spend ${data.restoreInfo.xpCost} XP to restore your streak?`)) return;
    setRestoring(true);
    try {
      const res = await fetch('/api/challenges/restore', { method: 'POST' });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Failed to restore streak');
        return;
      }
      toast.success(`Streak restored! 🔥 (-${result.xpSpent} XP)`);
      fetchDashboard();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner} />
        <p>Loading your challenge...</p>
      </div>
    );
  }

  if (!data) return null;

  const { user, todaysChallenge, restoreInfo } = data;
  const isCompleted = todaysChallenge?.status === 'completed' || todaysChallenge?.status === 'restored';
  const diffConfig = DIFFICULTY_COLORS[todaysChallenge?.difficulty || 'medium'];
  const today = format(new Date(), 'EEEE, MMMM d');
  const catEmoji = CATEGORY_EMOJIS[todaysChallenge?.category] || '🎯';

  // XP level system
  const level = Math.floor(user.totalXp / 500) + 1;
  const xpInLevel = user.totalXp % 500;
  const xpProgress = (xpInLevel / 500) * 100;

  return (
    <div className={styles.page}>
      {/* Celebration overlay */}
      {showCelebration && (
        <div className={styles.celebrationOverlay}>
          <div className={styles.celebrationCard}>
            <div className={styles.celebrationEmoji}>🎉</div>
            <h2>Challenge Complete!</h2>
            <p className={styles.celebrationXP}>+{todaysChallenge?.xp_reward || 60} XP</p>
            <p className={styles.celebrationStreak}>🔥 {user.current_streak + 1} day streak!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.dateLabel}>{today}</p>
          <h1 className={styles.greeting}>
            Hey, {user.name.split(' ')[0]} 👋
          </h1>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={`${styles.statCard} ${styles.statFire}`}>
          <div className={styles.statIcon}>🔥</div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{user.currentStreak}</span>
            <span className={styles.statLabel}>Day Streak</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statGold}`}>
          <div className={styles.statIcon}>⭐</div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{user?.totalXp?.toLocaleString()}</span>
            <span className={styles.statLabel}>Total XP</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statBlue}`}>
          <div className={styles.statIcon}>🏆</div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{user.bestStreak}</span>
            <span className={styles.statLabel}>Best Streak</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statPurple}`}>
          <div className={styles.statIcon}>⚡</div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>Lv. {level}</span>
            <span className={styles.statLabel}>Level</span>
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <div className={styles.xpBar}>
        <div className={styles.xpBarHeader}>
          <span className={styles.xpBarLabel}>Level {level} → {level + 1}</span>
          <span className={styles.xpBarValue}>{xpInLevel} / 500 XP</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${xpProgress}%` }} />
        </div>
      </div>

      {/* Restore streak banner */}
      {restoreInfo?.canRestore && (
        <div className={styles.restoreBanner}>
          <div>
            <p className={styles.restoreTitle}>⚠️ Streak at risk!</p>
            <p className={styles.restoreDesc}>You missed yesterday. Restore your streak for {restoreInfo.xpCost} XP.</p>
          </div>
          <button
            className={`btn btn-primary ${styles.restoreBtn}`}
            onClick={handleRestore}
            disabled={restoring}
          >
            {restoring ? '...' : `Restore (${restoreInfo.xpCost} XP)`}
          </button>
        </div>
      )}

      {/* Today's Challenge */}
      <div className={styles.challengeSection}>
        <div className={styles.challengeHeader}>
          <h2 className={styles.challengeTitle}>Today&apos;s Challenge</h2>
          {isCompleted && (
            <span className="badge badge-green">✓ Completed</span>
          )}
        </div>

        {todaysChallenge ? (
          <div className={`${styles.challengeCard} ${isCompleted ? styles.challengeCompleted : ''}`}>
            {/* Category + difficulty badges */}
            <div className={styles.challengeMeta}>
              <span
                className={styles.categoryBadge}
              >
                {catEmoji} {todaysChallenge.category}
              </span>
              <span
                className={styles.difficultyBadge}
                style={{ color: diffConfig.color, background: diffConfig.bg }}
              >
                {diffConfig.label}
              </span>
              <span className={styles.timeBadge}>
                ⏱ ~{todaysChallenge.estimated_minutes} min
              </span>
              <span className={styles.xpBadge}>
                ⭐ {todaysChallenge.xp_reward || todaysChallenge.xp_earned} XP
              </span>
            </div>

            <h3 className={styles.challengeName}>{todaysChallenge.title}</h3>
            <p className={styles.challengeDesc}>{todaysChallenge.description}</p>

            {/* Proof image if submitted */}
            {isCompleted && todaysChallenge.proof_image_url && (
              <div className={styles.proofImage}>
                <img src={todaysChallenge.proof_image_url} alt="Challenge proof" />
                <span className={styles.proofLabel}>📸 Proof submitted</span>
              </div>
            )}

            {/* Action section */}
            {!isCompleted && (
              <div className={styles.actionSection}>
                {/* Optional proof upload */}
                <div className={styles.proofUpload}>
                  <p className={styles.proofLabel2}>📸 Upload proof <span>(optional)</span></p>
                  <div className={styles.proofArea} onClick={() => fileRef.current?.click()}>
                    {proofPreview ? (
                      <img src={proofPreview} alt="Preview" className={styles.proofPreview} />
                    ) : (
                      <div className={styles.proofPlaceholder}>
                        <span>📷</span>
                        <span>Click to upload a photo</span>
                        <span className={styles.proofHint}>JPG, PNG up to 5MB</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  {proofFile && (
                    <button
                      className={styles.removeProof}
                      onClick={() => { setProofFile(null); setProofPreview(null); }}
                    >
                      ✕ Remove photo
                    </button>
                  )}
                </div>

                <button
                  className={`btn btn-primary ${styles.completeBtn}`}
                  onClick={handleComplete}
                  disabled={completing}
                >
                  {completing
                    ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Completing...</>
                    : <>✅ Mark as Complete</>}
                </button>
              </div>
            )}

            {isCompleted && (
              <div className={styles.completedMsg}>
                <span>🌟</span>
                <p>Excellent work! Come back tomorrow for your next challenge.</p>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.noChallenge}>
            <p>No challenge for today. Check back tomorrow!</p>
          </div>
        )}
      </div>
    </div>
  );
}
