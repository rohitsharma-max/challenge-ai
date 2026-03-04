import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateOtp, hashOtp } from '@/lib/auth';
import { sendSignupOtpEmail } from '@/lib/mailer';

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
        emailOtpRequestedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
    }

    if (user.emailOtpRequestedAt && Date.now() - new Date(user.emailOtpRequestedAt).getTime() < 60 * 1000) {
      return NextResponse.json({ error: 'Please wait before requesting another OTP' }, { status: 429 });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(normalizedEmail, otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const otpRequestedAt = new Date();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailOtpHash: otpHash,
        emailOtpExpiresAt: otpExpiresAt,
        emailOtpRequestedAt: otpRequestedAt,
      },
    });

    const sent = await sendSignupOtpEmail({ to: user.email, name: user.name, otp });
    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
