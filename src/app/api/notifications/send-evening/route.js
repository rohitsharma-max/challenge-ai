// src/app/api/notifications/send-evening/route.js
// Sends an evening streak-at-risk notification to users who haven't completed today.
//
// Trigger at 20:00 UTC (or your preferred evening time).
//
// Example vercel.json cron:
// {
//   "crons": [
//     { "path": "/api/notifications/send-morning", "schedule": "0 8 * * *" },
//     { "path": "/api/notifications/send-evening", "schedule": "0 20 * * *" }
//   ]
// }

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPushNotification, buildEveningPayload } from '@/lib/webpush';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

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
    const today = new Date(format(new Date(), 'yyyy-MM-dd') + 'T00:00:00.000Z');

    // Fetch subscriptions where:
    // 1. Evening notifications are enabled
    // 2. The user has NOT already completed today's challenge
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        eveningEnabled: true,
        user: {
          // Only notify users who have a pending challenge today
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

    console.log(`[evening-push] Sending to ${subscriptions.length} subscribers with pending challenges`);

    // How many hours until midnight?
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const hoursLeft = Math.max(1, Math.round((midnight - now) / (1000 * 60 * 60)));

    // Process in batches of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
      const batch = subscriptions.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (sub) => {
          try {
            const user = sub.user;
            const todayChallenge = user?.userChallenges?.[0];
            const challengeTitle = todayChallenge?.challenge?.title || null;

            const payload = buildEveningPayload({
              streak: user?.currentStreak || 0,
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