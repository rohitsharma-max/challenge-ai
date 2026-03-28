// src/components/NotificationSetup.js
// Handles:
// 1. Permission request UI
// 2. Subscribing to push via the Web Push API
// 3. Saving the subscription to the server
// 4. Exposing notification preferences (morning/evening toggles, time pickers)
//
// Usage:
//   import NotificationSetup from '@/components/NotificationSetup';
//   <NotificationSetup />   ← renders the full settings panel

'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import styles from './NotificationSetup.module.css';

// ─── Helper: convert VAPID base64 public key to Uint8Array ────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// ─── States the component can be in ──────────────────────────────────────────
const STATUS = {
  LOADING:       'loading',         // fetching initial state
  UNSUPPORTED:   'unsupported',     // browser doesn't support push
  DENIED:        'denied',          // user blocked notifications
  NOT_SUBSCRIBED: 'not_subscribed', // push supported but not yet subscribed
  SUBSCRIBING:   'subscribing',     // in the middle of subscribing
  SUBSCRIBED:    'subscribed',      // fully subscribed
  ERROR:         'error',           // something went wrong
};

export default function NotificationSetup({ compact = false }) {
  const [status, setStatus]             = useState(STATUS.LOADING);
  const [prefs, setPrefs]               = useState({
    morningEnabled: true,
    eveningEnabled: true,
    morningTime:    '08:00',
    eveningTime:    '20:00',
  });
  const [savingPrefs, setSavingPrefs]   = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState(null);

  // ── On mount: determine current notification state ────────────────────────
  useEffect(() => {
    async function init() {
      // 1. Check browser support
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatus(STATUS.UNSUPPORTED);
        return;
      }

      // 2. Check current browser permission
      const permission = Notification.permission;
      if (permission === 'denied') {
        setStatus(STATUS.DENIED);
        return;
      }

      // 3. Check if we already have a subscription registered on the server
      try {
        const res  = await fetch('/api/notifications/subscribe');
        const data = await res.json();

        if (data.hasSubscription) {
          // Also get the prefs from the most recent subscription
          const sub = data.subscriptions[0];
          setPrefs({
            morningEnabled: sub.morningEnabled,
            eveningEnabled: sub.eveningEnabled,
            morningTime:    sub.morningTime,
            eveningTime:    sub.eveningTime,
          });
          setStatus(STATUS.SUBSCRIBED);

          // Store the endpoint so we can update prefs for this device later
          const sw = await navigator.serviceWorker.ready;
          const existingSub = await sw.pushManager.getSubscription();
          if (existingSub) setCurrentEndpoint(existingSub.endpoint);
        } else {
          setStatus(STATUS.NOT_SUBSCRIBED);
        }
      } catch {
        setStatus(STATUS.NOT_SUBSCRIBED);
      }
    }

    init();
  }, []);

  // ── Subscribe flow ────────────────────────────────────────────────────────
  const handleSubscribe = useCallback(async () => {
    setStatus(STATUS.SUBSCRIBING);

    try {
      // 1. Request browser permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? STATUS.DENIED : STATUS.NOT_SUBSCRIBED);
        toast.error('Notification permission denied.');
        return;
      }

      // 2. Get VAPID key from server
      const keyRes  = await fetch('/api/notifications/subscribe');
      const keyData = await keyRes.json();

      if (!keyData.vapidPublicKey) {
        toast.error('Push notifications are not configured on the server yet.');
        setStatus(STATUS.NOT_SUBSCRIBED);
        return;
      }

      // 3. Subscribe via the browser Push API
      const sw = await navigator.serviceWorker.ready;
      const subscription = await sw.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(keyData.vapidPublicKey),
      });

      setCurrentEndpoint(subscription.endpoint);

      // 4. Save to server
      const saveRes = await fetch('/api/notifications/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          subscription,
          ...prefs,
        }),
      });

      if (!saveRes.ok) throw new Error('Failed to save subscription');

      setStatus(STATUS.SUBSCRIBED);
      toast.success('🔔 Notifications enabled!');
    } catch (err) {
      console.error('[NotificationSetup] Subscribe error:', err);
      toast.error('Failed to enable notifications. Please try again.');
      setStatus(STATUS.NOT_SUBSCRIBED);
    }
  }, [prefs]);

  // ── Unsubscribe flow ──────────────────────────────────────────────────────
  const handleUnsubscribe = useCallback(async () => {
    try {
      // 1. Unsubscribe from browser Push API
      const sw  = await navigator.serviceWorker.ready;
      const sub = await sw.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      // 2. Remove from server
      await fetch('/api/notifications/subscribe', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ endpoint: currentEndpoint }),
      });

      setStatus(STATUS.NOT_SUBSCRIBED);
      setCurrentEndpoint(null);
      toast.success('Notifications disabled.');
    } catch (err) {
      console.error('[NotificationSetup] Unsubscribe error:', err);
      toast.error('Failed to disable notifications.');
    }
  }, [currentEndpoint]);

  // ── Save preferences ──────────────────────────────────────────────────────
  const handleSavePrefs = useCallback(async () => {
    setSavingPrefs(true);
    try {
      const res = await fetch('/api/notifications/subscribe', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ endpoint: currentEndpoint, ...prefs }),
      });
      if (!res.ok) throw new Error();
      toast.success('Notification preferences saved!');
    } catch {
      toast.error('Failed to save preferences.');
    } finally {
      setSavingPrefs(false);
    }
  }, [prefs, currentEndpoint]);

  const updatePref = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));

  // ─── Render ───────────────────────────────────────────────────────────────

  if (status === STATUS.LOADING) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Checking notification status…</span>
      </div>
    );
  }

  if (status === STATUS.UNSUPPORTED) {
    return (
      <div className={styles.unsupported}>
        <span className={styles.unsupportedIcon}>🔕</span>
        <p>Push notifications aren't supported in this browser.</p>
        <p className={styles.hint}>Try installing Streakify on your home screen for full notification support.</p>
      </div>
    );
  }

  if (status === STATUS.DENIED) {
    return (
      <div className={styles.denied}>
        <span className={styles.deniedIcon}>🚫</span>
        <p className={styles.deniedTitle}>Notifications are blocked</p>
        <p className={styles.hint}>
          Open your browser settings, find Streakify, and set notifications to "Allow" — then reload the page.
        </p>
      </div>
    );
  }

  // ── Main panel ────────────────────────────────────────────────────────────
  return (
    <div className={`${styles.panel} ${compact ? styles.panelCompact : ''}`}>
      {/* Status row */}
      <div className={styles.statusRow}>
        <div className={styles.statusLeft}>
          <span className={`${styles.statusDot} ${status === STATUS.SUBSCRIBED ? styles.dotActive : styles.dotInactive}`} />
          <span className={styles.statusText}>
            {status === STATUS.SUBSCRIBED
              ? 'Push notifications enabled'
              : status === STATUS.SUBSCRIBING
              ? 'Enabling notifications…'
              : 'Push notifications off'}
          </span>
        </div>
        {status === STATUS.SUBSCRIBED ? (
          <button className={`${styles.toggleBtn} ${styles.toggleBtnOff}`} onClick={handleUnsubscribe}>
            Turn off
          </button>
        ) : (
          <button
            className={`${styles.toggleBtn} ${styles.toggleBtnOn}`}
            onClick={handleSubscribe}
            disabled={status === STATUS.SUBSCRIBING}
          >
            {status === STATUS.SUBSCRIBING ? 'Enabling…' : 'Enable'}
          </button>
        )}
      </div>

      {/* Preferences — only shown when subscribed */}
      {status === STATUS.SUBSCRIBED && (
        <div className={styles.prefs}>
          {/* Morning notification */}
          <div className={styles.prefRow}>
            <div className={styles.prefInfo}>
              <span className={styles.prefIcon}>☀️</span>
              <div>
                <p className={styles.prefTitle}>Morning challenge</p>
                <p className={styles.prefDesc}>Daily challenge reminder when you wake up</p>
              </div>
            </div>
            <div className={styles.prefControls}>
              {prefs.morningEnabled && (
                <input
                  type="time"
                  className={styles.timeInput}
                  value={prefs.morningTime}
                  onChange={(e) => updatePref('morningTime', e.target.value)}
                />
              )}
              <button
                className={`${styles.toggle} ${prefs.morningEnabled ? styles.toggleOn : ''}`}
                onClick={() => updatePref('morningEnabled', !prefs.morningEnabled)}
                aria-label="Toggle morning notification"
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
          </div>

          {/* Evening notification */}
          <div className={styles.prefRow}>
            <div className={styles.prefInfo}>
              <span className={styles.prefIcon}>🌙</span>
              <div>
                <p className={styles.prefTitle}>Evening streak reminder</p>
                <p className={styles.prefDesc}>Alert if you haven't completed the challenge yet</p>
              </div>
            </div>
            <div className={styles.prefControls}>
              {prefs.eveningEnabled && (
                <input
                  type="time"
                  className={styles.timeInput}
                  value={prefs.eveningTime}
                  onChange={(e) => updatePref('eveningTime', e.target.value)}
                />
              )}
              <button
                className={`${styles.toggle} ${prefs.eveningEnabled ? styles.toggleOn : ''}`}
                onClick={() => updatePref('eveningEnabled', !prefs.eveningEnabled)}
                aria-label="Toggle evening notification"
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
          </div>

          {/* Save button */}
          <button
            className={styles.saveBtn}
            onClick={handleSavePrefs}
            disabled={savingPrefs}
          >
            {savingPrefs ? 'Saving…' : 'Save preferences'}
          </button>

          <p className={styles.hint}>
            Times are approximate — notifications are sent by a server cron job and delivered when your device is online.
          </p>
        </div>
      )}

      {/* Not subscribed: show benefit callout */}
      {status === STATUS.NOT_SUBSCRIBED && (
        <div className={styles.callout}>
          <div className={styles.calloutItem}>🔥 Never break a streak by forgetting</div>
          <div className={styles.calloutItem}>⚡ Morning challenge delivered to you</div>
          <div className={styles.calloutItem}>⏰ Evening reminder if you haven't completed yet</div>
        </div>
      )}
    </div>
  );
}