// src/app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateOtp, hashOtp } from '@/lib/auth';
import { sendSignupOtpEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password)
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });

    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });

    const normalizedEmail = email.toLowerCase();
    const trimmedName = name.trim();

    // Check duplicate
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerified: true },
    });
    if (existing?.emailVerified)
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const otp = generateOtp();
    const otpHash = hashOtp(normalizedEmail, otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const otpRequestedAt = new Date();

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: trimmedName,
          passwordHash,
          emailOtpHash: otpHash,
          emailOtpExpiresAt: otpExpiresAt,
          emailOtpRequestedAt: otpRequestedAt,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          name: trimmedName,
          email: normalizedEmail,
          passwordHash,
          emailVerified: false,
          emailOtpHash: otpHash,
          emailOtpExpiresAt: otpExpiresAt,
          emailOtpRequestedAt: otpRequestedAt,
        },
      });
    }

    const sent = await sendSignupOtpEmail({ to: normalizedEmail, name: trimmedName, otp });
    console.log('OTP email sent:', sent);
    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email: normalizedEmail,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
