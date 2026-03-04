// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password)
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        onboardingComplete: true,
        emailVerified: true,
      },
    });

    if (!user)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Please verify your email first.',
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      onboardingComplete: user.onboardingComplete,
      emailVerified: user.emailVerified,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboardingComplete: user.onboardingComplete,
        emailVerified: user.emailVerified,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
