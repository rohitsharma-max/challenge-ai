// src/components/NotificationSetup.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

const STATUS = {
  LOADING:        'loading',
  UNSUPPORTED:    'unsupported',
  DENIED:         'denied',
  NOT_SUBSCRIBED: 'not_subscribed',
  SUBSCRIBING:    'subscribing',
  SUBSCRIBED:     'subscribed',
  ERROR:          'error',
};

export default function NotificationSetup({ compact = false }) {
  const [status, setStatus]       = useState(STATUS.LOADING);
  const [prefs, setPrefs]         = useState({ morningEnabled: true, eveningEnabled: true, morningTime: '08:00', eveningTime: '20:00' });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState(null);

  useEffect(() => {
    async function init() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) { setStatus(STATUS.UNSUPPORTED); return; }
      if (Notification.permission === 'denied') { setStatus(STATUS.DENIED); return; }
      try {
        const res  = await fetch('/api/notifications/subscribe');
        const data = await res.json();
        if (data.hasSubscription) {
          const sub = data.subscriptions[0];
          setPrefs({ morningEnabled: sub.morningEnabled, eveningEnabled: sub.eveningEnabled, morningTime: sub.morningTime, eveningTime: sub.eveningTime });
          setStatus(STATUS.SUBSCRIBED);
          const sw  = await navigator.serviceWorker.ready;
          const ex  = await sw.pushManager.getSubscription();
          if (ex) setCurrentEndpoint(ex.endpoint);
        } else { setStatus(STATUS.NOT_SUBSCRIBED); }
      } catch { setStatus(STATUS.NOT_SUBSCRIBED); }
    }
    init();
  }, []);

  const handleSubscribe = useCallback(async () => {
    setStatus(STATUS.SUBSCRIBING);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setStatus(permission === 'denied' ? STATUS.DENIED : STATUS.NOT_SUBSCRIBED); toast.error('Notification permission denied.'); return; }
      const keyRes  = await fetch('/api/notifications/subscribe');
      const keyData = await keyRes.json();
      if (!keyData.vapidPublicKey) { toast.error('Push notifications are not configured on the server yet.'); setStatus(STATUS.NOT_SUBSCRIBED); return; }
      const sw           = await navigator.serviceWorker.ready;
      const subscription = await sw.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(keyData.vapidPublicKey) });
      setCurrentEndpoint(subscription.endpoint);
      const saveRes = await fetch('/api/notifications/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription, ...prefs }) });
      if (!saveRes.ok) throw new Error('Failed to save subscription');
      setStatus(STATUS.SUBSCRIBED);
      toast.success('🔔 Notifications enabled!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to enable notifications. Please try again.');
      setStatus(STATUS.NOT_SUBSCRIBED);
    }
  }, [prefs]);

  const handleUnsubscribe = useCallback(async () => {
    try {
      const sw  = await navigator.serviceWorker.ready;
      const sub = await sw.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await fetch('/api/notifications/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: currentEndpoint }) });
      setStatus(STATUS.NOT_SUBSCRIBED);
      setCurrentEndpoint(null);
      toast.success('Notifications disabled.');
    } catch { toast.error('Failed to disable notifications.'); }
  }, [currentEndpoint]);

  const handleSavePrefs = useCallback(async () => {
    setSavingPrefs(true);
    try {
      const res = await fetch('/api/notifications/subscribe', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: currentEndpoint, ...prefs }) });
      if (!res.ok) throw new Error();
      toast.success('Notification preferences saved!');
    } catch { toast.error('Failed to save preferences.'); }
    finally   { setSavingPrefs(false); }
  }, [prefs, currentEndpoint]);

  const updatePref = (key, value) => setPrefs(p => ({ ...p, [key]: value }));

  /* ── Loading ── */
  if (status === STATUS.LOADING) return (
    <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
      <div className="spinner w-4 h-4 border-2" />
      <span>Checking notification status…</span>
    </div>
  );

  /* ── Unsupported ── */
  if (status === STATUS.UNSUPPORTED) return (
    <div className="p-5 rounded-2xl text-center" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
      <span className="text-3xl block mb-3">🔕</span>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Push notifications aren't supported in this browser.</p>
      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Try installing Streakify on your home screen for full notification support.</p>
    </div>
  );

  /* ── Denied ── */
  if (status === STATUS.DENIED) return (
    <div className="p-5 rounded-2xl text-center" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
      <span className="text-3xl block mb-3">🚫</span>
      <p className="text-[15px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Notifications are blocked</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Open your browser settings, find Streakify, and set notifications to "Allow" — then reload the page.
      </p>
    </div>
  );

  /* ── Toggle button shared styles ── */
  const ToggleSwitch = ({ enabled, onToggle, label }) => (
    <button
      className="relative w-11 h-[26px] rounded-full transition-colors duration-200 flex-shrink-0"
      style={{ background: enabled ? 'var(--accent)' : 'var(--border-strong)' }}
      onClick={onToggle}
      aria-label={label}
    >
      <span
        className="absolute top-[3px] w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200"
        style={{ left: enabled ? 'calc(100% - 23px)' : '3px' }}
      />
    </button>
  );

  return (
    <div className="flex flex-col gap-0">
      {/* ── Status row ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: status === STATUS.SUBSCRIBED ? 'var(--green)' : 'var(--text-muted)',
              boxShadow: status === STATUS.SUBSCRIBED ? '0 0 0 3px rgba(16,185,129,0.2)' : 'none' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {status === STATUS.SUBSCRIBED ? 'Push notifications enabled'
              : status === STATUS.SUBSCRIBING ? 'Enabling notifications…'
              : 'Push notifications off'}
          </span>
        </div>
        {status === STATUS.SUBSCRIBED ? (
          <button
            className="px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200"
            style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            onClick={handleUnsubscribe}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            Turn off
          </button>
        ) : (
          <button
            className="px-4 py-2 rounded-full text-[13px] font-semibold text-white transition-all duration-200"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 12px var(--accent-glow)' }}
            onClick={handleSubscribe}
            disabled={status === STATUS.SUBSCRIBING}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {status === STATUS.SUBSCRIBING ? 'Enabling…' : 'Enable'}
          </button>
        )}
      </div>

      {/* ── Prefs (subscribed) ── */}
      {status === STATUS.SUBSCRIBED && (
        <div className="flex flex-col gap-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          {[
            { key: 'morning', icon: '☀️', title: 'Morning challenge', desc: 'Daily challenge reminder when you wake up', enabledKey: 'morningEnabled', timeKey: 'morningTime' },
            { key: 'evening', icon: '🌙', title: 'Evening streak reminder', desc: "Alert if you haven't completed the challenge yet", enabledKey: 'eveningEnabled', timeKey: 'eveningTime' },
          ].map(row => (
            <div key={row.key}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl transition-all duration-200"
              style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl">{row.icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{row.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {prefs[row.enabledKey] && (
                  <input
                    type="time"
                    className="rounded-lg text-[13px] px-2 py-1.5 w-20 transition-all duration-200"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
                    value={prefs[row.timeKey]}
                    onChange={e => updatePref(row.timeKey, e.target.value)}
                    onFocus={ev => { ev.target.style.borderColor = 'var(--accent)'; ev.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
                    onBlur={ev  => { ev.target.style.borderColor = 'var(--border)'; ev.target.style.boxShadow = 'none'; }}
                  />
                )}
                <ToggleSwitch
                  enabled={prefs[row.enabledKey]}
                  onToggle={() => updatePref(row.enabledKey, !prefs[row.enabledKey])}
                  label={`Toggle ${row.key} notification`}
                />
              </div>
            </div>
          ))}

          <button
            className="self-end px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 12px var(--accent-glow)' }}
            onClick={handleSavePrefs}
            disabled={savingPrefs}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {savingPrefs ? 'Saving…' : 'Save preferences'}
          </button>

          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Times are approximate — notifications are sent by a server cron job and delivered when your device is online.
          </p>
        </div>
      )}

      {/* ── Not subscribed callout ── */}
      {status === STATUS.NOT_SUBSCRIBED && (
        <div className="mt-4 p-4 rounded-2xl flex flex-col gap-2"
          style={{ background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.2)' }}>
          {['🔥 Never break a streak by forgetting', '⚡ Morning challenge delivered to you', '⏰ Evening reminder if you haven\'t completed yet'].map(item => (
            <div key={item} className="text-[13px] font-medium flex items-center gap-2" style={{ color: 'var(--accent-light)' }}>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}