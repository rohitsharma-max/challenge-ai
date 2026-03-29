// src/app/layout.js — UPDATED with PWA support
// Replace your existing src/app/layout.js with this file

import './globals.css';
import { DM_Sans, Syne } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import PWASetup from '@/components/PWASetup';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata = {
  title: 'Streakify — Build Habits, Earn Streaks',
  description:
    'Get one personalized AI challenge every day and build streaks. Gamified habit-building that actually works.',
  keywords: 'daily challenge, habits, streak, productivity, gamification',

  // ── PWA metadata ──────────────────────────────────────────────────────────
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Streakify',
  },
  formatDetection: {
    telephone: false,
  },
  // Open Graph (looks great when shared)
  openGraph: {
    title: 'Streakify',
    description: 'One challenge. Every day. Build for life.',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,         // prevents zoom (feels more native)
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#7c3aed' },
    { media: '(prefers-color-scheme: light)', color: '#6d28d9' },
  ],
  viewportFit: 'cover',   // fills iPhone notch area
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ── PWA / Apple meta tags ── */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Streakify" />

        {/* Apple touch icons (iOS home screen) */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-128x128.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <link rel="shortcut icon" href="/icons/icon-96x96.png" />

        {/* Splash screen color on iOS */}
        <meta name="msapplication-TileColor" content="#7c3aed" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <body className={`${dmSans.variable} ${syne.variable}`}>
        <ThemeProvider>
          {children}
          {/* PWA install banner + service worker registration */}
          <PWASetup />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                padding: '12px 16px',
                boxShadow: 'var(--shadow-md)',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: 'white' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: 'white' },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
