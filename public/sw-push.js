// public/sw-push.js
// Service worker that handles Web Push API events.
// Merged into main SW registration via importScripts in public/sw.js

const CACHE_NAME = 'streakify-v1';
const APP_URL = self.location.origin;

// ─── Push event ──────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Streakify', body: event.data.text(), type: 'generic' };
  }

  const { title, body, type, icon, badge, data } = payload;

  // Build notification options based on type
  const options = {
    body: body || 'Check your daily challenge!',
    icon: icon || '/icons/icon-192x192.png',
    badge: badge || '/icons/icon-96x96.png',
    tag: type || 'streakify-notification',   // same tag = replaces old one
    renotify: true,
    requireInteraction: type === 'evening',  // evening alerts stay until dismissed
    data: { url: data?.url || '/dashboard', type },
    actions: getActions(type),
    vibrate: type === 'evening' ? [200, 100, 200, 100, 200] : [200],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(title || 'Streakify ⚡', options)
  );
});

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  let targetUrl = `${APP_URL}/dashboard`;

  if (action === 'complete') {
    targetUrl = `${APP_URL}/dashboard`;
  } else if (action === 'snooze') {
    // Snooze: re-show in 30 minutes via a scheduled message (best-effort)
    event.waitUntil(scheduleSnooze(notification));
    return;
  } else if (action === 'history') {
    targetUrl = `${APP_URL}/history`;
  } else {
    targetUrl = data.url ? `${APP_URL}${data.url}` : `${APP_URL}/dashboard`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If the app is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(APP_URL) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── Push subscription change ─────────────────────────────────────────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  // Re-subscribe and update server when the browser rotates keys
  event.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true })
      .then((subscription) => {
        return fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription }),
        });
      })
  );
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getActions(type) {
  if (type === 'morning') {
    return [
      { action: 'complete', title: "✅ Let's go!" },
      { action: 'snooze',   title: '⏰ Remind in 30m' },
    ];
  }
  if (type === 'evening') {
    return [
      { action: 'complete', title: '🔥 Complete now' },
      { action: 'history',  title: '📅 View history' },
    ];
  }
  return [{ action: 'complete', title: '⚡ Open app' }];
}

async function scheduleSnooze(notification) {
  // Show the same notification again after 30 minutes using a setTimeout trick.
  // Service workers can be killed, so this is best-effort — it works when the SW stays alive.
  await new Promise((resolve) => setTimeout(resolve, 30 * 60 * 1000));
  return self.registration.showNotification(notification.title, {
    body: notification.body,
    icon: notification.icon,
    badge: notification.badge,
    tag: 'streakify-snooze',
    data: notification.data,
    actions: getActions(notification.data?.type),
    vibrate: [200, 100, 200],
  });
}