// src/app/api/notifications/send-evening/route.js
//
// Cron runs every 30 minutes (see vercel.json).
// For each subscribed user, we check if the current IST time falls within
// ±15 minutes of their chosen evening notification time, AND they haven't
// completed today's challenge yet.

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPushNotification, buildEveningPayload } from '@/lib/webpush';
import { format } from 'date-fns';

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

  // Handle midnight wrap-around
  const diff = Math.min(
    Math.abs(nowTotalMin - prefTotalMin),
    1440 - Math.abs(nowTotalMin - prefTotalMin)
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
    // Use IST "today" date for challenge lookup
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(Date.now() + IST_OFFSET_MS);
    const today = new Date(format(istNow, 'yyyy-MM-dd') + 'T00:00:00.000Z');

    // Fetch subscriptions where:
    // 1. Evening notifications are enabled
    // 2. The user has NOT completed today's challenge yet
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        eveningEnabled: true,
        user: {
          userChallenges: {
            some: {
              challengeDate: today,
              status: 'pending',
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            currentStreak: true,
            userChallenges: {
              where: {
                challengeDate: today,
                status: 'pending',
              },
              include: { challenge: { select: { title: true } } },
              take: 1,
            },
          },
        },
      },
    });

    // Filter: only notify users whose preferred evening time matches now (IST)
    const toNotify = subscriptions.filter((sub) => isWithinWindow(sub.eveningTime));

    console.log(
      `[evening-push] ${subscriptions.length} pending users, ` +
      `${toNotify.length} match current IST time window`
    );

    if (toNotify.length === 0) {
      return NextResponse.json({ success: true, results });
    }

    // How many hours until IST midnight?
    const { totalMinutes: nowMin } = getISTTime();
    const minutesLeft = 1440 - nowMin;
    const hoursLeft = Math.max(1, Math.round(minutesLeft / 60));

    // Process in batches of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < toNotify.length; i += BATCH_SIZE) {
      const batch = toNotify.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (sub) => {
          try {
            const user = sub.user;
            const challengeTitle = user?.userChallenges?.[0]?.challenge?.title ?? null;

            const payload = buildEveningPayload({
              streak: user?.currentStreak ?? 0,
              challengeTitle,
              hoursLeft,
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
            console.error(`[evening-push] Error for sub ${sub.id}:`, err.message);
            results.failed++;
          }
        })
      );
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: expiredEndpoints } },
      });
      console.log(`[evening-push] Cleaned ${expiredEndpoints.length} expired subscriptions`);
    }

    console.log('[evening-push] Done:', results);
    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error('[evening-push] Fatal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  return POST(request);
}