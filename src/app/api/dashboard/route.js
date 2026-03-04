// src/app/api/dashboard/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getTodaysChallenge, checkAndUpdateStreak, getRestoreEligibility } from '@/lib/challenges';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = authUser.userId;

    // Handle missed-day streak logic
    await checkAndUpdateStreak(userId);

    const [user, todaysChallenge, restoreInfo] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, name: true, email: true,
          currentStreak: true, bestStreak: true, totalXp: true,
          difficulty: true, categories: true,
        },
      }),
      getTodaysChallenge(userId),
      getRestoreEligibility(userId),
    ]);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user, todaysChallenge, restoreInfo });
  } catch (err) {
    console.error('Dashboard error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
