// src/app/api/notifications/send-morning/route.js
//
// Cron runs every 30 minutes (see vercel.json).
// For each subscribed user, we check if the current IST time falls within
// ±15 minutes of their chosen morning notification time. This way each user
// gets notified at exactly the time THEY configured, regardless of timezone.

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPushNotification, buildMorningPayload } from '@/lib/webpush';
import { getTodaysChallenge } from '@/lib/challenges';

export const dynamic = 'force-dynamic';

/**
 * Convert a UTC Date to IST hours and minutes.
 * IST = UTC + 5:30
 */
function getISTTime(date = new Date()) {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    hours: ist.getUTCHours(),
    minutes: ist.getUTCMinutes(),
    totalMinutes: ist.getUTCHours() * 60 + ist.getUTCMinutes(),
  };
}

/**
 * Returns true if the current IST time is within ±15 minutes of preferredTime.
 * @param {string} preferredTime - "HH:MM" in the user's local time (IST for Indian users)
 */
function isWithinWindow(preferredTime) {
  if (!preferredTime) return false;

  const [prefHour, prefMin] = preferredTime.split(':').map(Number);
  const prefTotalMin = prefHour * 60 + prefMin;

  const { totalMinutes: nowTotalMin } = getISTTime();

  // Handle midnight wrap-around (e.g. preferred = 00:05, now = 23:55)
  const diff = Math.min(
    Math.abs(nowTotalMin - prefTotalMin),
    1440 - Math.abs(nowTotalMin - prefTotalMin) // 1440 = minutes in a day
  );

  return diff <= 15;
}

export async function POST(request) {
  // Validate cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { sent: 0, failed: 0, expired: 0, skipped: 0 };
  const expiredEndpoints = [];

  try {
    // Fetch all subscriptions with morning notifications enabled
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { morningEnabled: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            currentStreak: true,
          },
        },
      },
    });

    // Filter: only notify users whose preferred time matches the current IST time
    const toNotify = subscriptions.filter((sub) => isWithinWindow(sub.morningTime));

    console.log(
      `[morning-push] ${subscriptions.length} subscriptions total, ` +
      `${toNotify.length} match current IST time window`
    );

    if (toNotify.length === 0) {
      return NextResponse.json({ success: true, results });
    }

    // Process in batches of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < toNotify.length; i += BATCH_SIZE) {
      const batch = toNotify.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (sub) => {
          try {
            let challengeTitle = null;
            try {
              const challenge = await getTodaysChallenge(sub.userId);
              challengeTitle = challenge?.title ?? null;
            } catch {
              // Non-critical — send generic message if challenge fetch fails
            }

            const payload = buildMorningPayload({
              challengeTitle,
              streak: sub.user?.currentStreak ?? 0,
            });

            const result = await sendPushNotification(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              payload
            );

            if (result.success) {
              results.sent++;
            } else if (result.expired) {
              results.expired++;
              expiredEndpoints.push(sub.endpoint);
            } else {
              results.failed++;
            }
          } catch (err) {
            console.error(`[morning-push] Error for sub ${sub.id}:`, err.message);
            results.failed++;
          }
        })
      );
    }

    // Clean up expired subscriptions in bulk
    if (expiredEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: expiredEndpoints } },
      });
      console.log(`[morning-push] Cleaned ${expiredEndpoints.length} expired subscriptions`);
    }

    console.log('[morning-push] Done:', results);
    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error('[morning-push] Fatal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Allow GET for easy browser testing (still requires CRON_SECRET in production)
export async function GET(request) {
  return POST(request);
}