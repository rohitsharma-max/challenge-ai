// src/app/api/notifications/cron/route.js
//
// Handles BOTH morning and evening notifications in one endpoint.
// Called every 30 minutes by cron-job.org (free external cron service).
//
// Key rules:
//   Morning  → only notify if user has NOT completed today's challenge yet
//   Evening  → only notify if user has NOT completed today's challenge yet
//   Both     → only notify if current IST time is within ±15 min of user's preferred time

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPushNotification, buildMorningPayload, buildEveningPayload } from '@/lib/webpush';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getISTNow() {
  const ist = new Date(Date.now() + IST_OFFSET_MS);
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
    dateString: format(ist, 'yyyy-MM-dd'),
  };
}

/**
 * Returns true if current IST time is within ±15 minutes of preferredTime.
 * Handles midnight wrap-around (e.g. 23:55 vs 00:05 = 10 min apart).
 */
function isWithinWindow(preferredTime) {
  if (!preferredTime) return false;
  const [prefHour, prefMin] = preferredTime.split(':').map(Number);
  if (isNaN(prefHour) || isNaN(prefMin)) return false;

  const prefTotalMin = prefHour * 60 + prefMin;
  const { totalMinutes: nowTotalMin } = getISTNow();

  const diff = Math.min(
    Math.abs(nowTotalMin - prefTotalMin),
    1440 - Math.abs(nowTotalMin - prefTotalMin)
  );

  return diff <= 15;
}

async function processBatch(subscriptions, buildPayload) {
  const results = { sent: 0, failed: 0, expired: 0, skipped: 0 };
  const expiredEndpoints = [];
  const BATCH_SIZE = 50;

  for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
    const batch = subscriptions.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (sub) => {
        try {
          const payload = await buildPayload(sub);
          if (!payload) {
            results.skipped++;
            return;
          }

          const result = await sendPushNotification(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload
          );

          if (result.success) results.sent++;
          else if (result.expired) {
            results.expired++;
            expiredEndpoints.push(sub.endpoint);
          } else {
            results.failed++;
          }
        } catch (err) {
          console.error(`[cron] Error for sub ${sub.id}:`, err.message);
          results.failed++;
        }
      })
    );
  }

  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } },
    });
    console.log(`[cron] Cleaned ${expiredEndpoints.length} expired subscriptions`);
  }

  return results;
}

export async function POST(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ist = getISTNow();
  const today = new Date(ist.dateString + 'T00:00:00.000Z');

  console.log(`[cron] Running at IST ${ist.hours}:${String(ist.minutes).padStart(2, '0')}`);

  // ─────────────────────────────────────────────────────────────────────────
  // MORNING notifications
  // Only send to users who:
  //   1. Have morningEnabled = true
  //   2. Have NOT completed or restored today's challenge
  //   3. Their morningTime matches current IST time (±15 min)
  // ─────────────────────────────────────────────────────────────────────────
  const morningSubscriptions = await prisma.pushSubscription.findMany({
    where: {
      morningEnabled: true,
      user: {
        NOT: {
          userChallenges: {
            some: {
              challengeDate: today,
              status: { in: ['completed', 'restored'] },
            },
          },
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          currentStreak: true,
          userChallenges: {
            where: { challengeDate: today },
            include: { challenge: { select: { title: true } } },
            take: 1,
          },
        },
      },
    },
  });

  const morningToNotify = morningSubscriptions.filter((sub) =>
    isWithinWindow(sub.morningTime)
  );

  console.log(
    `[cron] Morning: ${morningSubscriptions.length} not completed today, ` +
    `${morningToNotify.length} match time window`
  );

  const morningResults = await processBatch(morningToNotify, async (sub) => {
    const challengeTitle = sub.user?.userChallenges?.[0]?.challenge?.title ?? null;
    return buildMorningPayload({
      challengeTitle,
      streak: sub.user?.currentStreak ?? 0,
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // EVENING notifications
  // Only send to users who:
  //   1. Have eveningEnabled = true
  //   2. Have a PENDING challenge today (not completed, not restored)
  //   3. Their eveningTime matches current IST time (±15 min)
  // ─────────────────────────────────────────────────────────────────────────
  const eveningSubscriptions = await prisma.pushSubscription.findMany({
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

  const eveningToNotify = eveningSubscriptions.filter((sub) =>
    isWithinWindow(sub.eveningTime)
  );

  console.log(
    `[cron] Evening: ${eveningSubscriptions.length} with pending challenge, ` +
    `${eveningToNotify.length} match time window`
  );

  const minutesUntilMidnight = 1440 - ist.totalMinutes;
  const hoursLeft = Math.max(1, Math.round(minutesUntilMidnight / 60));

  const eveningResults = await processBatch(eveningToNotify, async (sub) => {
    const challengeTitle = sub.user?.userChallenges?.[0]?.challenge?.title ?? null;
    return buildEveningPayload({
      streak: sub.user?.currentStreak ?? 0,
      challengeTitle,
      hoursLeft,
    });
  });

  const summary = {
    istTime: `${ist.hours}:${String(ist.minutes).padStart(2, '0')}`,
    morning: morningResults,
    evening: eveningResults,
  };

  console.log('[cron] Done:', summary);
  return NextResponse.json({ success: true, ...summary });
}

export async function GET(request) {
  return POST(request);
}