// src/app/api/auth/google/callback/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createToken } from '@/lib/auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Handle user cancellation or errors from Google
  if (error) {
    return NextResponse.redirect(`${appUrl}/login?error=google_auth_failed`);
  }

  // Verify state parameter
  const storedState = request.cookies.get('google-oauth-state')?.value;
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=no_code`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${appUrl}/login?error=token_exchange_failed`);
    }

    const tokens = await tokenRes.json();

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${appUrl}/login?error=userinfo_failed`);
    }

    const googleUser = await userInfoRes.json();
    const { id: googleId, email, name, picture } = googleUser;

    // Find existing user by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
    });

    if (user) {
      // Link Google account if user exists by email but hasn't linked Google yet
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            authProvider: user.authProvider === 'email' ? 'both' : user.authProvider,
            emailVerified: true,
            avatarUrl: user.avatarUrl || picture,
          },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0],
          email,
          googleId,
          authProvider: 'google',
          emailVerified: true,
          avatarUrl: picture || null,
        },
      });
    }

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      emailVerified: true,
      onboardingComplete: user.onboardingComplete,
    });

    // Determine redirect path
    const redirectPath = user.onboardingComplete ? '/dashboard' : '/onboarding';

    const response = NextResponse.redirect(`${appUrl}${redirectPath}`);

    // Set auth cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Clear OAuth state cookie
    response.cookies.delete('google-oauth-state');

    return response;
  } catch (err) {
    console.error('Google OAuth error:', err);
    return NextResponse.redirect(`${appUrl}/login?error=server_error`);
  }
}
