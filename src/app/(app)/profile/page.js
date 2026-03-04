// src/app/(app)/profile/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { useTheme } from '@/components/providers/ThemeProvider';
import styles from './profile.module.css';

const CATEGORIES = [
  { id: 'fitness', emoji: '💪', label: 'Fitness' },
  { id: 'productivity', emoji: '⚡', label: 'Productivity' },
  { id: 'learning', emoji: '🧠', label: 'Learning' },
  { id: 'fun', emoji: '🎉', label: 'Fun' },
  { id: 'social', emoji: '🤝', label: 'Social' },
];

const DIFFICULTIES = [
  { id: 'easy', emoji: '🌱', label: 'Easy', xp: 30 },
  { id: 'medium', emoji: '🔥', label: 'Medium', xp: 60 },
  { id: 'hard', emoji: '💎', label: 'Hard', xp: 120 },
];

export default function ProfilePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editForm, setEditForm] = useState({});
  const avatarInputRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/profile');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
        setEditForm({
          name: json.profile.name,
          categories: json.profile.categories || [],
          difficulty: json.profile.difficulty || 'medium',
          allowOutdoor: json.profile.allowOutdoor !== false,
        });
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      
      setData(prev => ({
        ...prev,
        profile: { ...prev.profile, ...editForm },
      }));
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (id) => {
    setEditForm(prev => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter(c => c !== id)
        : [...prev.categories, id],
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to upload avatar');

      setData(prev => ({
        ...prev,
        profile: { ...prev.profile, avatarUrl: json.avatarUrl },
      }));
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!data) return null;

  const { profile, stats } = data;
  const level = Math.floor(profile.totalXp / 500) + 1;
  const xpInLevel = profile.totalXp % 500;
  const memberSince = profile.createdAt
    ? format(parseISO(profile.createdAt), 'MMMM yyyy')
    : 'Unknown';
  
  const completionRate = stats.total_challenges > 0
    ? Math.round((stats.total_completed / stats.total_challenges) * 100)
    : 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
        {!editing ? (
          <button className="btn btn-ghost" onClick={() => setEditing(true)} style={{ fontSize: '14px', padding: '10px 18px' }}>
            ✏️ Edit
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setEditing(false)} style={{ fontSize: '14px', padding: '10px 18px' }}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ fontSize: '14px', padding: '10px 18px' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Avatar + name */}
      <div className={styles.profileCard}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={`${profile.name} avatar`} className={styles.avatarImage} />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
          </div>
          {editing && (
            <>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className={styles.avatarUploadBtn}
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? 'Uploading...' : 'Change'}
              </button>
            </>
          )}
        </div>
        {editing ? (
          <input
            className="input"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            style={{ maxWidth: 300, fontSize: '18px', fontWeight: 700 }}
          />
        ) : (
          <div>
            <h2 className={styles.profileName}>{profile.name}</h2>
            <p className={styles.profileEmail}>{profile.email}</p>
            <p className={styles.memberSince}>Member since {memberSince}</p>
          </div>
        )}
      </div>

      {/* Level badge */}
      <div className={styles.levelCard}>
        <div className={styles.levelBadge}>
          <span className={styles.levelNum}>Lv.{level}</span>
        </div>
        <div className={styles.levelInfo}>
          <div className={styles.levelHeader}>
            <span className={styles.levelLabel}>Level {level}</span>
            <span className={styles.levelXP}>{xpInLevel} / 500 XP to next level</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(xpInLevel / 500) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        {[
          { icon: '🔥', value: profile.currentStreak, label: 'Current Streak', sub: 'days' },
          { icon: '🏆', value: profile.bestStreak, label: 'Best Streak', sub: 'days' },
          { icon: '⭐', value: profile.totalXp?.toLocaleString(), label: 'Total XP', sub: 'earned' },
          { icon: '✅', value: `${completionRate}%`, label: 'Completion', sub: `${stats.total_completed} / ${stats.total_challenges}` },
        ].map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <span className={styles.statIcon}>{stat.icon}</span>
            <span className={styles.statValue}>{stat.value}</span>
            <span className={styles.statLabel}>{stat.label}</span>
            <span className={styles.statSub}>{stat.sub}</span>
          </div>
        ))}
      </div>

      {/* Preferences */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Preferences</h3>

        {/* Categories */}
        <div className={styles.prefGroup}>
          <p className={styles.prefLabel}>Challenge Categories</p>
          {editing ? (
            <div className={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.catChip} ${editForm.categories.includes(cat.id) ? styles.catChipSelected : ''}`}
                  onClick={() => toggleCategory(cat.id)}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.catDisplay}>
              {(profile.categories || []).map((cat) => {
                const found = CATEGORIES.find((c) => c.id === cat);
                return found ? (
                  <span key={cat} className={styles.catTag}>{found.emoji} {found.label}</span>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Difficulty */}
        <div className={styles.prefGroup}>
          <p className={styles.prefLabel}>Difficulty Level</p>
          {editing ? (
            <div className={styles.diffRow}>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  className={`${styles.diffChip} ${editForm.difficulty === d.id ? styles.diffChipSelected : ''}`}
                  onClick={() => setEditForm({ ...editForm, difficulty: d.id })}
                >
                  {d.emoji} {d.label}
                </button>
              ))}
            </div>
          ) : (
            <span className={styles.prefValue}>
              {DIFFICULTIES.find(d => d.id === profile.difficulty)?.emoji}{' '}
              {profile.difficulty.charAt(0).toUpperCase() + profile.difficulty.slice(1)}
            </span>
          )}
        </div>

        {/* Outdoor toggle */}
        <div className={styles.prefGroup}>
          <p className={styles.prefLabel}>Outdoor Challenges</p>
          {editing ? (
            <label className={styles.toggleRow}>
              <span>{editForm.allowOutdoor ? '✅ Allowed' : '❌ Not allowed'}</span>
              <button
                className={`${styles.toggle} ${editForm.allowOutdoor ? styles.toggleOn : ''}`}
                onClick={() => setEditForm({ ...editForm, allowOutdoor: !editForm.allowOutdoor })}
              >
                <span className={styles.toggleKnob} />
              </button>
            </label>
          ) : (
            <span className={styles.prefValue}>
              {profile.allowOutdoor !== false ? '✅ Allowed' : '❌ Not allowed'}
            </span>
          )}
        </div>
      </div>

      {/* Theme toggle */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Appearance</h3>
        <div className={styles.themeToggleRow}>
          <div>
            <p className={styles.prefLabel}>Theme</p>
            <p className={styles.themeDesc}>{theme === 'dark' ? '🌙 Dark mode active' : '☀️ Light mode active'}</p>
          </div>
          <button
            className={`btn btn-ghost ${styles.themeBtn}`}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
          </button>
        </div>
      </div>
    </div>
  );
}
