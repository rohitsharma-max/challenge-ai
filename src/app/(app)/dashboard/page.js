// src/app/(app)/dashboard/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const CATEGORY_EMOJIS = {
  fitness: '💪', productivity: '⚡', learning: '🧠', fun: '🎉', social: '🤝',
};

const DIFFICULTY_CONFIG = {
  easy:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Easy' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Medium' },
  hard:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Hard' },
};

// Typewriter animation
function TypingMessage({ text }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) return;
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i >= text.length) { setDone(true); clearInterval(interval); return; }
      setDisplayed(text.slice(0, i + 1));
      i++;
    }, 20);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && (
        <span style={{
          display: 'inline-block', width: 2, height: '1em',
          background: 'var(--accent-light)', marginLeft: 2,
          verticalAlign: 'text-bottom',
          animation: 'blink 0.7s step-end infinite',
        }} />
      )}
    </span>
  );
}

export default function DashboardPage() {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [completing, setCompleting] = useState(false);
  const [restoring, setRestoring]   = useState(false);
  const [proofFile, setProofFile]   = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [proofText, setProofText]   = useState('');
  const [proofError, setProofError] = useState(null); // rejection message
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
  const fileRef = useRef();

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load');
      setData(await res.json());
    } catch { toast.error('Failed to load dashboard'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  useEffect(() => () => { if (proofPreview) URL.revokeObjectURL(proofPreview); }, [proofPreview]);

  const fireConfetti = () => {
    const defaults = { origin: { y: 0.7 }, zIndex: 9999 };
    const fire = (r, o) => confetti({ ...defaults, ...o, particleCount: Math.floor(200 * r) });
    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#7c3aed', '#9f5bff'] });
    fire(0.2,  { spread: 60, colors: ['#ff6b35', '#fbbf24'] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#10b981', '#34d399'] });
    fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#fff'] });
    fire(0.1,  { spread: 120, startVelocity: 45, colors: ['#7c3aed', '#ff6b35'] });
  };

  const closeCelebration = () => {
    setShowCelebration(false);
    fetchDashboard();
  };

  const handleComplete = async () => {
    if (!proofText.trim()) { toast.error('Please describe how you completed the challenge'); return; }
    setProofError(null);
    setCompleting(true);
    try {
      const formData = new FormData();
      formData.append('proofText', proofText.trim());
      if (proofFile) formData.append('proof', proofFile);

      const res    = await fetch('/api/challenges/complete', { method: 'POST', body: formData });
      const result = await res.json();

      if (!res.ok) {
        if (result.proofRejected) {
          // Show rejection inline — don't toast, show it under the textarea
          setProofError(result.error || 'Please write more detail about what you actually did.');
        } else {
          toast.error(result.error || 'Failed to complete challenge');
        }
        return;
      }

      setCelebrationData({
        xpEarned: result.xpEarned,
        newStreak: result.newStreak,
        claudeReaction: result.claudeReaction,
      });
      setShowCelebration(true);
      fireConfetti();
      // NO auto-dismiss — user closes manually
    } catch { toast.error('Something went wrong'); }
    finally  { setCompleting(false); }
  };

  const handleRestore = async () => {
    if (!confirm(`Spend ${data.restoreInfo.xpCost} XP to restore your streak?`)) return;
    setRestoring(true);
    try {
      const res    = await fetch('/api/challenges/restore', { method: 'POST' });
      const result = await res.json();
      if (!res.ok) { toast.error(result.error || 'Failed to restore streak'); return; }
      toast.success(`Streak restored! 🔥 (-${result.xpSpent} XP)`);
      fetchDashboard();
    } catch { toast.error('Something went wrong'); }
    finally  { setRestoring(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" style={{ color: 'var(--text-secondary)' }}>
      <div className="spinner w-9 h-9 border-[3px]" />
      <p>Loading your challenge...</p>
    </div>
  );

  if (!data) return null;

  const { user, todaysChallenge, restoreInfo } = data;
  const isCompleted = todaysChallenge?.status === 'completed' || todaysChallenge?.status === 'restored';
  const diffConfig  = DIFFICULTY_CONFIG[todaysChallenge?.difficulty || 'medium'];
  const today       = format(new Date(), 'EEEE, MMMM d');
  const catEmoji    = CATEGORY_EMOJIS[todaysChallenge?.category] || '🎯';
  const level       = Math.floor(user.totalXp / 500) + 1;
  const xpInLevel   = user.totalXp % 500;
  const xpProgress  = (xpInLevel / 500) * 100;

  return (
    <div className="animate-fade-in">
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

      {/* ── Celebration overlay — NO auto-dismiss ───────────────────────────── */}
      {showCelebration && celebrationData && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)' }}
        >
          <div
            className="rounded-3xl p-8 sm:p-10 animate-scale-in mx-4 flex flex-col gap-5"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 60px rgba(0,0,0,0.6), 0 0 80px var(--accent-glow)',
              maxWidth: 440,
              width: '100%',
            }}
          >
            {/* Header */}
            <div className="text-center">
              <span className="text-6xl block mb-4 animate-bounce">🎉</span>
              <h2 className="font-display text-3xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
                Challenge Complete!
              </h2>
              <div className="flex items-center justify-center gap-4">
                <span className="font-display text-xl font-bold" style={{ color: 'var(--gold)' }}>
                  +{celebrationData.xpEarned} XP
                </span>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span className="text-lg font-semibold" style={{ color: 'var(--fire)' }}>
                  🔥 {celebrationData.newStreak} day streak
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* AI reaction */}
            {celebrationData.claudeReaction ? (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(159,91,255,0.05))',
                  border: '1px solid rgba(124,58,237,0.2)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-light))' }}
                  >
                    ⚡
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent-light)' }}>
                    AI Coach says
                  </span>
                </div>
                <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>
                  "<TypingMessage text={celebrationData.claudeReaction} />"
                </p>
              </div>
            ) : (
              // No reaction (no API key set) — show simpler success state
              <div
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                <span className="text-2xl">🌟</span>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Keep building your streak — consistency is everything.
                </p>
              </div>
            )}

            {/* Close button — explicit, not auto-dismiss */}
            <button
              className="btn btn-primary w-full py-3.5 text-base rounded-2xl"
              onClick={closeCelebration}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{today}</p>
          <h1 className="font-display text-[28px] sm:text-[30px] font-extrabold" style={{ color: 'var(--text-primary)' }}>
            Hey, {user.name.split(' ')[0]} 👋
          </h1>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { icon: '🔥', value: user.currentStreak,             label: 'Day Streak',  accent: 'rgba(255,107,53,0.2)' },
          { icon: '⭐', value: user?.totalXp?.toLocaleString(), label: 'Total XP',    accent: 'rgba(251,191,36,0.2)' },
          { icon: '🏆', value: user.bestStreak,                 label: 'Best Streak', accent: 'rgba(59,130,246,0.2)' },
          { icon: '⚡', value: `Lv. ${level}`,                  label: 'Level',       accent: 'rgba(124,58,237,0.2)' },
        ].map((stat) => (
          <div key={stat.label}
            className="flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'var(--bg-card)', border: `1px solid ${stat.accent}` }}>
            <span className="text-2xl leading-none">{stat.icon}</span>
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-xl font-extrabold leading-none" style={{ color: 'var(--text-primary)' }}>{stat.value}</span>
              <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── XP Progress ── */}
      <div className="rounded-2xl p-4 mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex justify-between mb-2.5">
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Level {level} → {level + 1}</span>
          <span className="text-[13px] font-semibold" style={{ color: 'var(--accent-light)' }}>{xpInLevel} / 500 XP</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${xpProgress}%` }} />
        </div>
      </div>

      {/* ── Restore banner ── */}
      {restoreInfo?.canRestore && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl mb-6"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--gold)' }}>⚠️ Streak at risk!</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              You missed yesterday. Restore your streak for {restoreInfo.xpCost} XP.
            </p>
          </div>
          <button className="btn btn-primary flex-shrink-0 text-[13px] px-4 py-2.5" onClick={handleRestore} disabled={restoring}>
            {restoring ? '...' : `Restore (${restoreInfo.xpCost} XP)`}
          </button>
        </div>
      )}

      {/* ── Today's Challenge ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Today's Challenge</h2>
          {isCompleted && <span className="badge badge-green">✓ Completed</span>}
        </div>

        {todaysChallenge ? (
          <div
            className="rounded-3xl p-6 sm:p-7 transition-all duration-200 animate-slide-up"
            style={{
              background: isCompleted ? 'linear-gradient(135deg, var(--bg-card), rgba(16,185,129,0.04))' : 'var(--bg-card)',
              border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
            }}
          >
            {/* Meta badges */}
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold capitalize"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}>
                {catEmoji} {todaysChallenge.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ color: diffConfig.color, background: diffConfig.bg }}>
                {diffConfig.label}
              </span>
              <span className="px-3 py-1 rounded-full text-xs"
                style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)' }}>
                ⏱ ~{todaysChallenge.estimatedMinutes} min
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(251,191,36,0.12)', color: 'var(--gold)' }}>
                ⭐ {todaysChallenge.xpReward || todaysChallenge.xpEarned} XP
              </span>
            </div>

            <h3 className="font-display text-xl sm:text-[22px] font-extrabold mb-3 leading-snug" style={{ color: 'var(--text-primary)' }}>
              {todaysChallenge.title}
            </h3>
            <p className="text-[15px] leading-relaxed mb-7" style={{ color: 'var(--text-secondary)' }}>
              {todaysChallenge.description}
            </p>

            {/* Completed state */}
            {isCompleted && (
              <>
                {todaysChallenge.proofText && (
                  <div className="rounded-xl p-4 mb-4"
                    style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--accent-light)' }}>📝 Your proof:</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{todaysChallenge.proofText}</p>
                  </div>
                )}
                {todaysChallenge.proofImageUrl && (
                  <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <img src={todaysChallenge.proofImageUrl} alt="Challenge proof" className="w-full max-h-72 object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: 'rgba(16,185,129,0.08)' }}>
                  <span className="text-2xl">🌟</span>
                  <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
                    Excellent work! Come back tomorrow for your next challenge.
                  </p>
                </div>
              </>
            )}

            {/* Action section */}
            {!isCompleted && (
              <div className="border-t pt-6 flex flex-col gap-5" style={{ borderColor: 'var(--border)' }}>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    📝 How did you complete it?
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                      Required
                    </span>
                  </label>
                  <textarea
                    className="w-full rounded-xl text-sm leading-relaxed p-3 resize-y min-h-[100px] transition-all duration-200 box-border"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: `1.5px solid ${proofError ? '#ef4444' : 'var(--border)'}`,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-body)',
                    }}
                    placeholder="Describe what you actually did. E.g. 'I ran 3km in the park, legs were burning but I pushed through the last 500m...'"
                    value={proofText}
                    onChange={(e) => { setProofText(e.target.value); if (proofError) setProofError(null); }}
                    rows={4}
                    maxLength={500}
                    onFocus={e => { e.target.style.borderColor = proofError ? '#ef4444' : 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
                    onBlur={e  => { e.target.style.borderColor = proofError ? '#ef4444' : 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                  />

                  {/* Proof rejection error */}
                  {proofError && (
                    <div className="mt-2 flex items-start gap-2 p-3 rounded-xl animate-fade-in"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <span className="text-base flex-shrink-0">⚠️</span>
                      <p className="text-sm leading-relaxed" style={{ color: '#ef4444' }}>
                        {proofError}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      ⚡ AI validates your proof and reacts personally
                    </p>
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{proofText.length}/500</p>
                  </div>
                </div>

                {/* Optional photo */}
                <div>
                  <p className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    📸 Upload photo <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>
                  </p>
                  <div
                    className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 min-h-[100px] flex items-center justify-center"
                    style={{ border: '1.5px dashed var(--border)' }}
                    onClick={() => fileRef.current?.click()}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    {proofPreview ? (
                      <img src={proofPreview} alt="Preview" className="w-full max-h-52 object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 p-6" style={{ color: 'var(--text-muted)' }}>
                        <span className="text-3xl">📷</span>
                        <span className="text-sm">Click to upload a photo</span>
                        <span className="text-[11px]">JPG, PNG up to 5MB</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                  {proofFile && (
                    <button className="text-xs mt-2" style={{ color: 'var(--red)' }}
                      onClick={() => { if (proofPreview) URL.revokeObjectURL(proofPreview); setProofFile(null); setProofPreview(null); }}>
                      ✕ Remove photo
                    </button>
                  )}
                </div>

                <button
                  className="btn btn-primary w-full py-4 text-[17px] rounded-2xl animate-pulse-glow"
                  onClick={handleComplete}
                  disabled={completing || !proofText.trim()}
                >
                  {completing
                    ? <><span className="spinner w-[18px] h-[18px] border-2" /> Validating your proof…</>
                    : <>✅ Complete & Get Reaction</>}
                </button>

                <p className="text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  AI checks that your proof is genuine before saving your streak
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <p>No challenge for today. Check back tomorrow!</p>
          </div>
        )}
      </div>
    </div>
  );
}