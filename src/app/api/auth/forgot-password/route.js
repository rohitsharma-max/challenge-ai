import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateOtp, hashOtp } from '@/lib/auth';
import { sendResetPasswordOtpEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        resetPasswordOtpRequestedAt: true,
      },
    });

    // Do not reveal whether an account exists.
    if (!user || !user.emailVerified) {
      return NextResponse.json({ success: true });
    }

    if (
      user.resetPasswordOtpRequestedAt &&
      Date.now() - new Date(user.resetPasswordOtpRequestedAt).getTime() < 60 * 1000
    ) {
      return NextResponse.json({ error: 'Please wait before requesting another OTP' }, { status: 429 });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(normalizedEmail, otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const otpRequestedAt = new Date();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOtpHash: otpHash,
        resetPasswordOtpExpiresAt: otpExpiresAt,
        resetPasswordOtpRequestedAt: otpRequestedAt,
      },
    });

    const sent = await sendResetPasswordOtpEmail({ to: user.email, name: user.name, otp });
    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
