// src/app/api/onboarding/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, createToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { categories, difficulty, allowOutdoor } = await request.json();

    const validCategories = ['fitness', 'productivity', 'learning', 'fun', 'social'];
    const validDifficulties = ['easy', 'medium', 'hard'];

    const filtered = (categories || []).filter((c) => validCategories.includes(c));
    if (!filtered.length)
      return NextResponse.json({ error: 'Select at least one valid category' }, { status: 400 });

    if (!validDifficulties.includes(difficulty))
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 });

    const user = await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        categories: filtered,
        difficulty,
        allowOutdoor: allowOutdoor !== false,
        onboardingComplete: true,
      },
      select: { id: true, name: true, email: true },
    });

    const newToken = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      onboardingComplete: true,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch (err) {
    console.error('Onboarding error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
