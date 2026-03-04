// src/app/(app)/history/page.js
'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import styles from './history.module.css';

const STATUS_CONFIG = {
  completed: { label: 'Completed', icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  missed: { label: 'Missed', icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  pending: { label: 'Pending', icon: '⏳', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  restored: { label: 'Restored', icon: '🔄', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
};

const CAT_EMOJIS = {
  fitness: '💪', productivity: '⚡', learning: '🧠', fun: '🎉', social: '🤝',
};

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ completed: 0, missed: 0, total: 0 });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/history?limit=60');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setHistory(data.history);
        
        const completed = data.history.filter(h => h.status === 'completed' || h.status === 'restored').length;
        const missed = data.history.filter(h => h.status === 'missed').length;
        setStats({ completed, missed, total: data.history.length });
      } catch {
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading history...</p>
      </div>
    );
  }

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Challenge History</h1>
        <p className={styles.subtitle}>Your journey so far</p>
      </div>

      {/* Summary stats */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryNum} style={{ color: '#10b981' }}>{stats.completed}</span>
          <span className={styles.summaryLabel}>Completed</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryNum} style={{ color: '#ef4444' }}>{stats.missed}</span>
          <span className={styles.summaryLabel}>Missed</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryNum} style={{ color: 'var(--accent-light)' }}>{completionRate}%</span>
          <span className={styles.summaryLabel}>Completion</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryNum} style={{ color: 'var(--gold)' }}>{stats.total}</span>
          <span className={styles.summaryLabel}>Total Days</span>
        </div>
      </div>

      {/* Completion bar */}
      <div className={styles.completionBar}>
        <div className={styles.completionBarFill} style={{ width: `${completionRate}%` }} />
      </div>

      {/* History list */}
      {history.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>📅</p>
          <p>No challenges yet. Start with today&apos;s challenge!</p>
        </div>
      ) : (
        <div className={styles.historyList}>
          {history.map((item, idx) => {
            const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            const catEmoji = CAT_EMOJIS[item.category] || '🎯';
            let dateStr = '';
            try {
              dateStr = format(parseISO(item.challengeDate), 'MMM d, yyyy');
            } catch {
              dateStr = item.challengeDate;
            }

            return (
              <div
                key={item.id}
                className={styles.historyItem}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div
                  className={styles.statusIcon}
                  style={{ background: status.bg, color: status.color }}
                >
                  {status.icon}
                </div>

                <div className={styles.itemContent}>
                  <div className={styles.itemHeader}>
                    <h3 className={styles.itemTitle}>
                      {item.title || 'Challenge'}
                    </h3>
                    <span className={styles.itemDate}>{dateStr}</span>
                  </div>

                  <div className={styles.itemMeta}>
                    {item.category && (
                      <span className={styles.metaTag}>
                        {catEmoji} {item.category}
                      </span>
                    )}
                    {item.difficulty && (
                      <span className={styles.metaTag}>
                        {item.difficulty}
                      </span>
                    )}
                    <span
                      className={styles.statusBadge}
                      style={{ color: status.color, background: status.bg }}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>

                <div className={styles.itemXP}>
                  {item.xpEarned > 0 && (
                    <>
                      <span className={styles.xpAmount}>+{item.xpEarned}</span>
                      <span className={styles.xpLabel}>XP</span>
                    </>
                  )}
                </div>

                {item.proofImageUrl && (
                  <a
                    href={item.proofImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.proofThumb}
                    title="View proof"
                  >
                    <img src={item.proofImageUrl} alt="Proof" />
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
