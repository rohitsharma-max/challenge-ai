// src/app/api/notifications/cron/route.js
//
// This single endpoint handles BOTH morning and evening notifications.
// It runs every 30 minutes via an EXTERNAL free cron service (cron-job.org).
//
// WHY external: Vercel Hobby only allows 1 daily cron.
// cron-job.org is FREE and supports any schedule including every 30 minutes.
//
// Setup instructions at bottom of this file.

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPushNotification, buildMorningPayload, buildEveningPayload } from '@/lib/webpush';
import { getTodaysChallenge } from '@/lib/challenges';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

// IST = UTC + 5:30
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
 * Returns true if the current IST time is within ±15 minutes of preferredTime.
 * Handles midnight wrap-around correctly.
 * @param {string} preferredTime - "HH:MM" in IST
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

async function processBatch(subscriptions, handler) {
  const results = { sent: 0, failed: 0, expired: 0 };
  const expiredEndpoints = [];
  const BATCH_SIZE = 50;

  for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
    const batch = subscriptions.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (sub) => {
        try {
          const payload = await handler(sub);
          if (!payload) { results.failed++; return; }

          const result = await sendPushNotification(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload
          );

          if (result.success) results.sent++;
          else if (result.expired) { results.expired++; expiredEndpoints.push(sub.endpoint); }
          else results.failed++;
        } catch (err) {
          console.error(`[cron] Error for sub ${sub.id}:`, err.message);
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

  // ── Morning notifications ─────────────────────────────────────────────────
  const morningSubscriptions = await prisma.pushSubscription.findMany({
    where: { morningEnabled: true },
    include: {
      user: { select: { id: true, currentStreak: true } },
    },
  });

  const morningToNotify = morningSubscriptions.filter((sub) =>
    isWithinWindow(sub.morningTime)
  );

  console.log(
    `[cron] Morning: ${morningSubscriptions.length} subscriptions, ` +
    `${morningToNotify.length} in time window`
  );

  const morningResults = await processBatch(morningToNotify, async (sub) => {
    let challengeTitle = null;
    try {
      const challenge = await getTodaysChallenge(sub.userId);
      challengeTitle = challenge?.title ?? null;
    } catch { /* non-critical */ }

    return buildMorningPayload({
      challengeTitle,
      streak: sub.user?.currentStreak ?? 0,
    });
  });

  // ── Evening notifications ─────────────────────────────────────────────────
  const eveningSubscriptions = await prisma.pushSubscription.findMany({
    where: {
      eveningEnabled: true,
      user: {
        userChallenges: {
          some: { challengeDate: today, status: 'pending' },
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          currentStreak: true,
          userChallenges: {
            where: { challengeDate: today, status: 'pending' },
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
    `[cron] Evening: ${eveningSubscriptions.length} pending users, ` +
    `${eveningToNotify.length} in time window`
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

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SETUP: cron-job.org (FREE, no credit card needed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to https://cron-job.org and create a free account

2. Click "CREATE CRONJOB"

3. Fill in:
   Title:    Streakify Notifications
   URL:      https://your-domain.vercel.app/api/notifications/cron
   Schedule: Every 30 minutes  (select "Custom" → /30 * * * *)

4. Under "Advanced" → Headers, add:
   Name:   Authorization
   Value:  Bearer <your CRON_SECRET from .env.local>

5. Save and enable the cron job

That's it! cron-job.org will call your endpoint every 30 minutes,
and users will receive notifications within 15 minutes of their
chosen time.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  UPDATE vercel.json (remove the broken crons)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replace your vercel.json with just: {}
Or keep it empty — no crons needed since cron-job.org handles it.
*/