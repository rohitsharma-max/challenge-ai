// src/middleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production-min-32-chars'
);

const publicPaths = ['/login', '/signup', '/'];
const onboardingPath = '/onboarding';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Allow public assets and API routes for auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/uploads') ||
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/signup' ||
    pathname === '/api/auth/logout'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value;

  // Verify token
  let payload = null;
  if (token) {
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch {
      payload = null;
    }
  }

  const isAuthenticated = !!payload;
  const isPublicPath = publicPaths.includes(pathname);
  const isDashboardPath = pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/history') || 
                          pathname.startsWith('/profile') ||
                          pathname.startsWith('/onboarding');

  // Redirect unauthenticated users from protected routes
  if (!isAuthenticated && isDashboardPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
    // Check onboarding status
    if (!payload.onboardingComplete) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Force onboarding for users who haven't completed it
  if (isAuthenticated && !payload.onboardingComplete && pathname !== '/onboarding' && isDashboardPath) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
