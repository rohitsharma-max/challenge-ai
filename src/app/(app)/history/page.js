// src/app/(app)/history/page.js
'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  completed: { label: 'Completed', icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  missed:    { label: 'Missed',    icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
  pending:   { label: 'Pending',   icon: '⏳', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  restored:  { label: 'Restored',  icon: '🔄', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
};

const CAT_EMOJIS = {
  fitness: '💪', productivity: '⚡', learning: '🧠', fun: '🎉', social: '🤝',
};

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats]     = useState({ completed: 0, missed: 0, total: 0 });

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/history?limit=60');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setHistory(data.history);
        const completed = data.history.filter(h => h.status === 'completed' || h.status === 'restored').length;
        const missed    = data.history.filter(h => h.status === 'missed').length;
        setStats({ completed, missed, total: data.history.length });
      } catch { toast.error('Failed to load history'); }
      finally   { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" style={{ color: 'var(--text-secondary)' }}>
      <div className="spinner w-9 h-9 border-[3px]" />
      <p>Loading history...</p>
    </div>
  );

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="font-display text-[28px] font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>
          Challenge History
        </h1>
        <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>Your journey so far</p>
      </div>

      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { value: stats.completed,   label: 'Completed', color: '#10b981' },
          { value: stats.missed,      label: 'Missed',    color: '#ef4444' },
          { value: `${completionRate}%`, label: 'Completion', color: 'var(--accent-light)' },
          { value: stats.total,       label: 'Total Days', color: 'var(--gold)' },
        ].map((s) => (
          <div key={s.label}
            className="flex flex-col items-center gap-1 py-5 px-3 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <span className="font-display text-[28px] font-extrabold leading-none" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Completion bar ─────────────────────────────────────────────────── */}
      <div className="mb-8 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${completionRate}%`, background: 'linear-gradient(90deg,#10b981,#34d399)' }}
        />
      </div>

      {/* ── List ───────────────────────────────────────────────────────────── */}
      {history.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
          <p className="text-5xl mb-4">📅</p>
          <p>No challenges yet. Start with today's challenge!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {history.map((item, idx) => {
            const status   = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            const catEmoji = CAT_EMOJIS[item.category] || '🎯';
            let dateStr = '';
            try { dateStr = format(parseISO(item.challengeDate), 'MMM d, yyyy'); }
            catch { dateStr = item.challengeDate; }

            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 px-4 py-4 rounded-2xl transition-all duration-200 animate-fade-in sm:flex-row sm:items-center sm:gap-4 sm:px-5 hover:translate-x-0.5"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  animationDelay: `${idx * 30}ms`,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                {/* Status icon */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: status.bg, color: status.color }}>
                  {status.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col gap-1.5 mb-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <h3 className="text-sm font-semibold break-words sm:truncate" style={{ color: 'var(--text-primary)' }}>
                      {item.title || 'Challenge'}
                    </h3>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{dateStr}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.category && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full capitalize"
                        style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)' }}>
                        {catEmoji} {item.category}
                      </span>
                    )}
                    {item.difficulty && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full capitalize"
                        style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)' }}>
                        {item.difficulty}
                      </span>
                    )}
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ color: status.color, background: status.bg }}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* XP */}
                <div className="flex flex-row items-center gap-1.5 flex-shrink-0 sm:flex-col sm:gap-0">
                  {item.xpEarned > 0 && (
                    <>
                      <span className="font-display text-base font-extrabold leading-none" style={{ color: 'var(--gold)' }}>+{item.xpEarned}</span>
                      <span className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>XP</span>
                    </>
                  )}
                </div>

                {/* Proof thumb */}
                {item.proofImageUrl && (
                  <a href={item.proofImageUrl} target="_blank" rel="noreferrer"
                    className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ border: '1px solid var(--border)' }}>
                    <img src={item.proofImageUrl} alt="Proof" className="w-full h-full object-cover" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
