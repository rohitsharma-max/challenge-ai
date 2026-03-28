// src/app/api/notifications/subscribe/route.js
// POST  — save a new push subscription (or update an existing one by endpoint)
// DELETE — remove the subscription for the current user

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { VAPID_PUBLIC_KEY } from '@/lib/webpush';

export const dynamic = 'force-dynamic';

// ── GET: return VAPID public key + current subscription state ─────────────────
export async function GET(request) {
  const authUser = await getUserFromRequest(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check how many active subscriptions this user has
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: authUser.userId },
    select: {
      id: true,
      endpoint: true,
      morningEnabled: true,
      eveningEnabled: true,
      morningTime: true,
      eveningTime: true,
    },
  });

  return NextResponse.json({
    vapidPublicKey: VAPID_PUBLIC_KEY || null,
    subscriptions: subs,
    hasSubscription: subs.length > 0,
  });
}

// ── POST: register a push subscription ───────────────────────────────────────
export async function POST(request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { subscription, morningEnabled, eveningEnabled, morningTime, eveningTime } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription object — must include endpoint and keys' },
        { status: 400 }
      );
    }

    // Upsert: update if this endpoint already exists (e.g. refreshed keys), else create
    const record = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        userId: authUser.userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        morningEnabled: morningEnabled !== false,
        eveningEnabled: eveningEnabled !== false,
        morningTime: morningTime || '08:00',
        eveningTime: eveningTime || '20:00',
      },
      update: {
        // If the same device re-subscribes, refresh the keys
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        morningEnabled: morningEnabled !== undefined ? morningEnabled : undefined,
        eveningEnabled: eveningEnabled !== undefined ? eveningEnabled : undefined,
        morningTime: morningTime || undefined,
        eveningTime: eveningTime || undefined,
      },
    });

    return NextResponse.json({ success: true, id: record.id });
  } catch (err) {
    console.error('Subscribe error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH: update notification preferences without re-subscribing ─────────────
export async function PATCH(request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { endpoint, morningEnabled, eveningEnabled, morningTime, eveningTime } = await request.json();

    // If endpoint not provided, update all of this user's subscriptions
    const where = endpoint
      ? { endpoint }
      : undefined;

    if (where) {
      await prisma.pushSubscription.updateMany({
        where: { ...where, userId: authUser.userId },
        data: {
          ...(morningEnabled !== undefined && { morningEnabled }),
          ...(eveningEnabled !== undefined && { eveningEnabled }),
          ...(morningTime    && { morningTime }),
          ...(eveningTime    && { eveningTime }),
        },
      });
    } else {
      // Update all subscriptions for this user
      await prisma.pushSubscription.updateMany({
        where: { userId: authUser.userId },
        data: {
          ...(morningEnabled !== undefined && { morningEnabled }),
          ...(eveningEnabled !== undefined && { eveningEnabled }),
          ...(morningTime    && { morningTime }),
          ...(eveningTime    && { eveningTime }),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update subscription error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE: remove a specific subscription by endpoint ───────────────────────
export async function DELETE(request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { endpoint } = await request.json().catch(() => ({}));

    if (endpoint) {
      // Delete the specific device subscription
      await prisma.pushSubscription.deleteMany({
        where: { endpoint, userId: authUser.userId },
      });
    } else {
      // Delete ALL subscriptions for this user
      await prisma.pushSubscription.deleteMany({
        where: { userId: authUser.userId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}