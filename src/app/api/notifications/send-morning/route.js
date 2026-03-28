// src/app/api/notifications/send-morning/route.js
// Sends the morning challenge notification to all subscribed users.
//
// Trigger this with a cron job at 08:00 UTC (or any time you prefer).
// Deploy on Vercel: use Vercel Cron (vercel.json) or an external cron service.
//
// Protect with CRON_SECRET to prevent abuse:
//   Authorization: Bearer <CRON_SECRET>
//
// Example vercel.json cron:
// {
//   "crons": [{ "path": "/api/notifications/send-morning", "schedule": "0 8 * * *" }]
// }

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPushNotification, buildMorningPayload } from '@/lib/webpush';
import { getTodaysChallenge } from '@/lib/challenges';

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
    // Fetch all subscriptions that have morning notifications enabled
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

    console.log(`[morning-push] Sending to ${subscriptions.length} subscriptions`);

    // Process in batches of 50 to avoid memory spikes on large user counts
    const BATCH_SIZE = 50;
    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
      const batch = subscriptions.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (sub) => {
          try {
            // Get or generate today's challenge for this user
            let challengeTitle = null;
            try {
              const challenge = await getTodaysChallenge(sub.userId);
              challengeTitle = challenge?.title || null;
            } catch {
              // Non-critical — send generic message if challenge fetch fails
            }

            const payload = buildMorningPayload({
              challengeTitle,
              streak: sub.user?.currentStreak || 0,
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

// Allow GET for easy testing in browser (will still require CRON_SECRET in production)
export async function GET(request) {
  return POST(request);
}