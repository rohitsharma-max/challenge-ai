import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createToken, verifyOtpHash } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    if (!/^\d{6}$/.test(String(otp))) {
      return NextResponse.json({ error: 'OTP must be 6 digits' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        onboardingComplete: true,
        emailVerified: true,
        emailOtpHash: true,
        emailOtpExpiresAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or OTP' }, { status: 400 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified. Please log in.' }, { status: 400 });
    }
    if (!user.emailOtpHash || !user.emailOtpExpiresAt || user.emailOtpExpiresAt < new Date()) {
      return NextResponse.json({ error: 'OTP expired. Request a new one.' }, { status: 400 });
    }

    const isValid = verifyOtpHash(normalizedEmail, String(otp), user.emailOtpHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or OTP' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailOtpHash: null,
        emailOtpExpiresAt: null,
        emailOtpRequestedAt: null,
      },
    });

    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      onboardingComplete: user.onboardingComplete,
      emailVerified: true,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboardingComplete: user.onboardingComplete,
        emailVerified: true,
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
    console.error('Verify email error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
