// src/app/api/challenges/restore/route.js
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { restoreStreak } from '@/lib/challenges';

export async function POST(request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await restoreStreak(authUser.userId);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('Restore streak error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 400 });
  }
}
