// src/app/onboarding/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'fitness',      emoji: '💪', label: 'Fitness',      desc: 'Workouts, movement, outdoors' },
  { id: 'productivity', emoji: '⚡', label: 'Productivity',  desc: 'Focus, systems, work' },
  { id: 'learning',     emoji: '🧠', label: 'Learning',      desc: 'Skills, knowledge, growth' },
  { id: 'fun',          emoji: '🎉', label: 'Fun',           desc: 'Hobbies, creativity, joy' },
  { id: 'social',       emoji: '🤝', label: 'Social',        desc: 'Relationships, community' },
];

const DIFFICULTIES = [
  { id: 'easy',   label: 'Easy',   emoji: '🌱', desc: '10–20 min challenges', xp: '30 XP' },
  { id: 'medium', label: 'Medium', emoji: '🔥', desc: '30–60 min challenges', xp: '60 XP' },
  { id: 'hard',   label: 'Hard',   emoji: '💎', desc: '60–120 min challenges', xp: '120 XP' },
];

export default function OnboardingPage() {
  const router        = useRouter();
  const [step, setStep]           = useState(1);
  const [selected, setSelected]   = useState([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [allowOutdoor, setAllowOutdoor] = useState(true);
  const [loading, setLoading]     = useState(false);

  const toggleCategory = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
  );

  const handleFinish = async () => {
    if (!selected.length) { toast.error('Please select at least one category!'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categories: selected, difficulty, allowOutdoor }) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Something went wrong'); return; }
      toast.success('All set! Your first challenge awaits 🚀');
      router.push('/dashboard');
    } catch { toast.error('Failed to save preferences'); }
    finally   { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>
      {/* Orb */}
      <div className="fixed pointer-events-none z-0"
        style={{ top: -100, right: -100, width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)' }} />

      <div className="w-full max-w-[600px] relative z-10">
        {/* Progress */}
        <div className="w-full h-1 rounded-full mb-3 overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(step / 2) * 100}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-light))' }} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest mb-10" style={{ color: 'var(--text-muted)' }}>
          Step {step} of 2
        </p>

        {step === 1 && (
          <div className="animate-slide-up">
            <div className="text-[40px] mb-4">🎯</div>
            <h1 className="font-display text-[30px] font-extrabold mb-2.5" style={{ color: 'var(--text-primary)' }}>
              What do you want to work on?
            </h1>
            <p className="text-base leading-relaxed mb-9" style={{ color: 'var(--text-secondary)' }}>
              Select all that interest you. Your challenges will be personalized.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-9">
              {CATEGORIES.map(cat => {
                const sel = selected.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    className="relative flex flex-col items-start gap-1 p-5 rounded-2xl text-left transition-all duration-200"
                    style={{
                      background: sel ? 'var(--accent-dim)' : 'var(--bg-card)',
                      border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                      boxShadow: sel ? '0 0 0 1px var(--accent)' : 'none',
                      transform: 'translateY(0)',
                    }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <span className="text-3xl mb-2">{cat.emoji}</span>
                    <span className="font-display font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>{cat.label}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{cat.desc}</span>
                    {sel && (
                      <span className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-bold text-white"
                        style={{ background: 'var(--accent)' }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              className="btn btn-primary w-full py-4 text-base rounded-2xl"
              onClick={() => { if (!selected.length) { toast.error('Pick at least one category!'); return; } setStep(2); }}
            >
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up">
            <div className="text-[40px] mb-4">⚔️</div>
            <h1 className="font-display text-[30px] font-extrabold mb-2.5" style={{ color: 'var(--text-primary)' }}>
              How hard do you want it?
            </h1>
            <p className="text-base leading-relaxed mb-9" style={{ color: 'var(--text-secondary)' }}>
              Start easy and level up, or dive straight into the deep end.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
              {DIFFICULTIES.map(d => {
                const sel = difficulty === d.id;
                return (
                  <button
                    key={d.id}
                    className="relative flex flex-col items-start gap-1 p-5 rounded-2xl text-left transition-all duration-200"
                    style={{
                      background: sel ? 'var(--accent-dim)' : 'var(--bg-card)',
                      border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                      boxShadow: sel ? '0 0 0 1px var(--accent)' : 'none',
                    }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    onClick={() => setDifficulty(d.id)}
                  >
                    <span className="text-2xl mb-2">{d.emoji}</span>
                    <span className="font-display font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>{d.label}</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{d.desc}</span>
                    <span className="text-[11px] font-semibold mt-1" style={{ color: 'var(--gold)' }}>{d.xp} per day</span>
                    {sel && (
                      <span className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-bold text-white"
                        style={{ background: 'var(--accent)' }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Outdoor toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl mb-8"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div>
                <p className="text-[15px] font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>🌿 Allow outdoor challenges</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Some challenges require going outside</p>
              </div>
              <button
                className="relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ml-4"
                style={{ background: allowOutdoor ? 'var(--accent)' : 'var(--border-strong)' }}
                onClick={() => setAllowOutdoor(!allowOutdoor)}
              >
                <span
                  className="absolute top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-md transition-transform duration-200"
                  style={{ left: allowOutdoor ? 'calc(100% - 25px)' : '3px' }}
                />
              </button>
            </div>

            <div className="flex gap-3">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button
                className="btn btn-primary flex-1 py-4 text-base rounded-2xl"
                onClick={handleFinish}
                disabled={loading}
              >
                {loading ? <><span className="spinner w-4 h-4 border-2" /> Setting up...</> : "🚀 Let's Go!"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}