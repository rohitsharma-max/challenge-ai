import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, verifyOtpHash } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Email, OTP and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(String(otp))) {
      return NextResponse.json({ error: 'OTP must be 6 digits' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        resetPasswordOtpHash: true,
        resetPasswordOtpExpiresAt: true,
      },
    });

    if (
      !user ||
      !user.resetPasswordOtpHash ||
      !user.resetPasswordOtpExpiresAt ||
      user.resetPasswordOtpExpiresAt < new Date()
    ) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    const isValid = verifyOtpHash(normalizedEmail, String(otp), user.resetPasswordOtpHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordOtpHash: null,
        resetPasswordOtpExpiresAt: null,
        resetPasswordOtpRequestedAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
