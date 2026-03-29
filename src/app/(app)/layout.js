// src/app/(app)/layout.js
'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTheme } from '@/components/providers/ThemeProvider';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '⚡', label: 'Dashboard' },
  { href: '/history',   icon: '📅', label: 'History' },
  { href: '/profile',   icon: '👤', label: 'Profile' },
];

export default function AppLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex fixed top-0 left-0 h-screen w-60 flex-col justify-between px-4 py-6 z-50 transition-colors duration-300"
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
      >
        {/* Top */}
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-1">
            <span className="text-2xl">⚡</span>
            <span className="font-display font-extrabold text-[18px]" style={{ color: 'var(--text-primary)' }}>
              Streakify
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: active ? 'var(--accent-dim)' : 'transparent',
                    color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
                    fontWeight: active ? '600' : '500',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                >
                  <span className="text-lg w-5 text-center">{item.icon}</span>
                  <span>{item.label}</span>
                  {active && (
                    <span
                      className="absolute right-2.5 w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--accent)' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-1">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-medium w-full text-left transition-all duration-200"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-medium w-full text-left transition-all duration-200"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = 'var(--red)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <span>↩</span>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ───────────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex items-stretch z-50 py-2"
        style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 min-w-0 flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-xl transition-all duration-200"
              style={{ color: active ? 'var(--accent-light)' : 'var(--text-secondary)' }}
            >
              <span>{item.icon}</span>
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={toggleTheme}
          className="flex flex-1 min-w-0 flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-xl transition-all duration-200"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span className="text-[10px] font-medium truncate">Theme</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex flex-1 min-w-0 flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-xl transition-all duration-200"
          style={{ color: '#ef4444' }}
        >
          <span>↩</span>
          <span className="text-[10px] font-medium truncate">Logout</span>
        </button>
      </nav>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-60 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-[900px] mx-auto px-4 md:px-8 pt-10 pb-20 md:pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}
