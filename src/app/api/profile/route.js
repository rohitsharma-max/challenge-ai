// src/app/api/profile/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true, name: true, email: true,
        currentStreak: true, bestStreak: true, totalXp: true,
        categories: true, difficulty: true, allowOutdoor: true,
        theme: true, createdAt: true, avatarUrl: true,
      },
    });

    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const [totalCompleted, totalMissed, totalChallenges] = await Promise.all([
      prisma.userChallenge.count({
        where: { userId: authUser.userId, status: { in: ['completed', 'restored'] } },
      }),
      prisma.userChallenge.count({
        where: { userId: authUser.userId, status: 'missed' },
      }),
      prisma.userChallenge.count({ where: { userId: authUser.userId } }),
    ]);

    return NextResponse.json({
      profile,
      stats: { total_completed: totalCompleted, total_missed: totalMissed, total_challenges: totalChallenges },
    });
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validDifficulties = ['easy', 'medium', 'hard'];
    const validCategories = ['fitness', 'productivity', 'learning', 'fun', 'social'];

    const data = {};
    if (body.name && typeof body.name === 'string') data.name = body.name.trim();
    if (body.theme === 'dark' || body.theme === 'light') data.theme = body.theme;
    if (Array.isArray(body.categories)) {
      data.categories = body.categories.filter((c) => validCategories.includes(c));
    }
    if (validDifficulties.includes(body.difficulty)) data.difficulty = body.difficulty;
    if (typeof body.allowOutdoor === 'boolean') data.allowOutdoor = body.allowOutdoor;
    else if (typeof body.allow_outdoor === 'boolean') data.allowOutdoor = body.allow_outdoor;
    if (typeof body.avatarUrl === 'string' || body.avatarUrl === null) data.avatarUrl = body.avatarUrl;

    if (!Object.keys(data).length)
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });

    await prisma.user.update({ where: { id: authUser.userId }, data });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Profile PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
