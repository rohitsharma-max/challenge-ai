// src/lib/webpush.js
// Web push notification utilities for sending push notifications to subscribers

import webpush from 'web-push';

// Export VAPID public key for client-side subscription
export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;

// Configure web-push with VAPID credentials
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to a subscription
 * @param {Object} subscription - Push subscription object with endpoint, p256dh, auth
 * @param {Object} payload - Notification payload
 * @returns {Promise<Object>} Result object with success, expired, and other status info
 */
export async function sendPushNotification(subscription, payload) {
  try {
    // web-push needs p256dh and auth as keys1 and keys2
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    return { success: true, expired: false };
  } catch (error) {
    // Check if subscription is expired (410 Gone)
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, expired: true };
    }

    console.error('[webpush] Send error:', error.message);
    return { success: false, expired: false };
  }
}

/**
 * Build a morning notification payload
 * @param {Object} options - Options for the payload
 * @param {string} options.challengeTitle - Title of today's challenge
 * @param {number} options.streak - Current streak count
 * @returns {Object} Notification payload
 */
export function buildMorningPayload({ challengeTitle, streak }) {
  return {
    title: '🌅 Rise and Shine!',
    body: challengeTitle
      ? `${challengeTitle} • Streak: ${streak} days`
      : `Your daily challenge awaits! Streak: ${streak} days`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'morning-challenge',
    requireInteraction: false,
    data: {
      url: '/dashboard',
      type: 'morning',
    },
  };
}

/**
 * Build an evening notification payload
 * @param {Object} options - Options for the payload
 * @param {number} options.streak - Current streak count
 * @param {string} options.challengeTitle - Title of today's challenge
 * @param {number} options.hoursLeft - Hours until midnight
 * @returns {Object} Notification payload
 */
export function buildEveningPayload({ streak, challengeTitle, hoursLeft }) {
  return {
    title: '⚠️ Your Streak is at Risk!',
    body: challengeTitle
      ? `Complete "${challengeTitle}" in ${hoursLeft} hours to keep your ${streak}-day streak`
      : `Complete today's challenge in ${hoursLeft} hours to keep your ${streak}-day streak`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'evening-reminder',
    requireInteraction: true,
    data: {
      url: '/dashboard',
      type: 'evening',
    },
  };
}
