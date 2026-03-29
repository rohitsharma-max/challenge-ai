// src/app/(app)/profile/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { useTheme } from '@/components/providers/ThemeProvider';
import NotificationSetup from '@/components/NotificationSetup';

const CATEGORIES = [
  { id: 'fitness',      emoji: '💪', label: 'Fitness' },
  { id: 'productivity', emoji: '⚡', label: 'Productivity' },
  { id: 'learning',     emoji: '🧠', label: 'Learning' },
  { id: 'fun',          emoji: '🎉', label: 'Fun' },
  { id: 'social',       emoji: '🤝', label: 'Social' },
];

const DIFFICULTIES = [
  { id: 'easy',   emoji: '🌱', label: 'Easy',   xp: 30 },
  { id: 'medium', emoji: '🔥', label: 'Medium', xp: 60 },
  { id: 'hard',   emoji: '💎', label: 'Hard',   xp: 120 },
];

export default function ProfilePage() {
  const [data, setData]                       = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [editing, setEditing]                 = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editForm, setEditForm]               = useState({});
  const avatarInputRef                        = useRef(null);
  const { theme, toggleTheme }                = useTheme();

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/profile');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
        setEditForm({
          name:        json.profile.name,
          categories:  json.profile.categories || [],
          difficulty:  json.profile.difficulty || 'medium',
          allowOutdoor: json.profile.allowOutdoor !== false,
        });
      } catch { toast.error('Failed to load profile'); }
      finally   { setLoading(false); }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(prev => ({ ...prev, profile: { ...prev.profile, ...editForm } }));
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save changes'); }
    finally   { setSaving(false); }
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
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res  = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to upload avatar');
      setData(prev => ({ ...prev, profile: { ...prev.profile, avatarUrl: json.avatarUrl } }));
      toast.success('Avatar updated');
    } catch (err) { toast.error(err.message || 'Failed to upload avatar'); }
    finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" style={{ color: 'var(--text-secondary)' }}>
      <div className="spinner w-9 h-9 border-[3px]" />
      <p>Loading profile...</p>
    </div>
  );

  if (!data) return null;

  const { profile, stats } = data;
  const level           = Math.floor(profile.totalXp / 500) + 1;
  const xpInLevel       = profile.totalXp % 500;
  const memberSince     = profile.createdAt ? format(parseISO(profile.createdAt), 'MMMM yyyy') : 'Unknown';
  const completionRate  = stats.total_challenges > 0 ? Math.round((stats.total_completed / stats.total_challenges) * 100) : 0;

  /* ── Reusable section wrapper ── */
  const Section = ({ title, children }) => (
    <div className="rounded-3xl p-6 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <h3 className="font-display text-base font-bold mb-5 pb-3" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
        {title}
      </h3>
      {children}
    </div>
  );

  const PrefLabel = ({ children }) => (
    <p className="text-[12px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-muted)' }}>{children}</p>
  );

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-7">
        <h1 className="font-display text-[28px] font-extrabold" style={{ color: 'var(--text-primary)' }}>Profile</h1>
        {!editing ? (
          <button className="btn btn-ghost text-sm px-4 py-2.5" onClick={() => setEditing(true)}>✏️ Edit</button>
        ) : (
          <div className="flex gap-2.5">
            <button className="btn btn-ghost text-sm px-4 py-2.5" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary text-sm px-4 py-2.5" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* ── Profile card ── */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 rounded-3xl mb-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="w-16 h-16 rounded-full flex items-center justify-center font-display text-3xl font-extrabold text-white overflow-hidden"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-light))', boxShadow: '0 4px 20px var(--accent-glow)' }}>
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt={`${profile.name} avatar`} className="w-full h-full object-cover" />
              : profile.name.charAt(0).toUpperCase()}
          </div>
          {editing && (
            <>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
              <button
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all duration-200"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text-secondary)' }}
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-light)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                {uploadingAvatar ? 'Uploading...' : 'Change'}
              </button>
            </>
          )}
        </div>

        {/* Info */}
        {editing ? (
          <input
            className="input max-w-xs text-lg font-bold"
            value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
          />
        ) : (
          <div className="text-center sm:text-left">
            <h2 className="font-display text-xl font-extrabold mb-0.5" style={{ color: 'var(--text-primary)' }}>{profile.name}</h2>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{profile.email}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Member since {memberSince}</p>
          </div>
        )}
      </div>

      {/* ── Level card ── */}
      <div className="flex items-center gap-4 p-5 rounded-3xl mb-4"
        style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(159,91,255,0.05))', border: '1px solid rgba(124,58,237,0.2)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent)', boxShadow: '0 4px 16px var(--accent-glow)' }}>
          <span className="font-display text-base font-extrabold text-white">Lv.{level}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between mb-2.5">
            <span className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>Level {level}</span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{xpInLevel} / 500 XP to next level</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(xpInLevel / 500) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { icon: '🔥', value: profile.currentStreak,            label: 'Current Streak', sub: 'days' },
          { icon: '🏆', value: profile.bestStreak,               label: 'Best Streak',    sub: 'days' },
          { icon: '⭐', value: profile.totalXp?.toLocaleString(), label: 'Total XP',       sub: 'earned' },
          { icon: '✅', value: `${completionRate}%`,              label: 'Completion',     sub: `${stats.total_completed} / ${stats.total_challenges}` },
        ].map(stat => (
          <div key={stat.label} className="flex flex-col items-center gap-1 p-5 rounded-2xl text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <span className="text-[22px] mb-1">{stat.icon}</span>
            <span className="font-display text-xl font-extrabold leading-none" style={{ color: 'var(--text-primary)' }}>{stat.value}</span>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{stat.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Preferences ── */}
      <Section title="Preferences">
        {/* Categories */}
        <div className="mb-5">
          <PrefLabel>Challenge Categories</PrefLabel>
          {editing ? (
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const sel = editForm.categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    className="px-3.5 py-2 rounded-full text-[13px] font-medium transition-all duration-200"
                    style={{
                      background: sel ? 'var(--accent-dim)' : 'var(--bg-glass)',
                      border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                      color: sel ? 'var(--accent-light)' : 'var(--text-secondary)',
                    }}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profile.categories || []).map(cat => {
                const found = CATEGORIES.find(c => c.id === cat);
                return found ? (
                  <span key={cat} className="px-3.5 py-1.5 rounded-full text-[13px] font-medium"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}>
                    {found.emoji} {found.label}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Difficulty */}
        <div className="mb-5">
          <PrefLabel>Difficulty Level</PrefLabel>
          {editing ? (
            <div className="flex flex-col sm:flex-row gap-2.5">
              {DIFFICULTIES.map(d => {
                const sel = editForm.difficulty === d.id;
                return (
                  <button
                    key={d.id}
                    className="flex-1 flex flex-col items-start gap-1 p-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200"
                    style={{
                      background: sel ? 'var(--accent-dim)' : 'var(--bg-glass)',
                      border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                      color: sel ? 'var(--accent-light)' : 'var(--text-secondary)',
                    }}
                    onClick={() => setEditForm({ ...editForm, difficulty: d.id })}
                  >
                    {d.emoji} {d.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="text-[15px] font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
              {DIFFICULTIES.find(d => d.id === profile.difficulty)?.emoji}{' '}
              {profile.difficulty.charAt(0).toUpperCase() + profile.difficulty.slice(1)}
            </span>
          )}
        </div>

        {/* Outdoor toggle */}
        <div>
          <PrefLabel>Outdoor Challenges</PrefLabel>
          {editing ? (
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {editForm.allowOutdoor ? '✅ Allowed' : '❌ Not allowed'}
              </span>
              <button
                className="relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0"
                style={{ background: editForm.allowOutdoor ? 'var(--accent)' : 'var(--border-strong)' }}
                onClick={() => setEditForm({ ...editForm, allowOutdoor: !editForm.allowOutdoor })}
              >
                <span
                  className="absolute top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-md transition-transform duration-200"
                  style={{ left: editForm.allowOutdoor ? 'calc(100% - 25px)' : '3px' }}
                />
              </button>
            </label>
          ) : (
            <span className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>
              {profile.allowOutdoor !== false ? '✅ Allowed' : '❌ Not allowed'}
            </span>
          )}
        </div>
      </Section>

      {/* ── Notifications ── */}
      <Section title="Notifications">
        <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
          Get reminders for your daily challenge and streak protection alerts.
        </p>
        <NotificationSetup />
      </Section>

      {/* ── Appearance ── */}
      <Section title="Appearance">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <PrefLabel>Theme</PrefLabel>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {theme === 'dark' ? '🌙 Dark mode active' : '☀️ Light mode active'}
            </p>
          </div>
          <button className="btn btn-ghost text-sm px-4 py-2.5" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
          </button>
        </div>
      </Section>
    </div>
  );
}