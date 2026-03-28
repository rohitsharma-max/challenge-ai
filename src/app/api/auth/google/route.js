// src/app/api/auth/google/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAppUrl } from '@/lib/app-url';

export async function GET(request) {
  const state = crypto.randomBytes(16).toString('hex');
  const appUrl = getAppUrl(request);

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${appUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );

  response.cookies.set('google-oauth-state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  return response;
}
