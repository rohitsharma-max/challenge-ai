// src/app/(app)/layout.js
'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTheme } from '@/components/providers/ThemeProvider';
import styles from './app.module.css';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '⚡', label: 'Dashboard' },
  { href: '/history', icon: '📅', label: 'History' },
  { href: '/profile', icon: '👤', label: 'Profile' },
];

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link href="/dashboard" className={styles.logo}>
            <span className={styles.logoIcon}>⚡</span>
            <span className={styles.logoText}>Streakify</span>
          </Link>

          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${pathname === item.href ? styles.navActive : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
                {pathname === item.href && <span className={styles.navIndicator} />}
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <button className={styles.themeBtn} onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span>↩</span>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className={styles.mobileNav}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.mobileNavItem} ${pathname === item.href ? styles.mobileNavActive : ''}`}
          >
            <span>{item.icon}</span>
            <span className={styles.mobileNavLabel}>{item.label}</span>
          </Link>
        ))}
        <button className={styles.mobileNavItem} onClick={toggleTheme}>
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span className={styles.mobileNavLabel}>Theme</span>
        </button>
         <button className={`${styles.mobileNavItem} ${styles.mobileNavLogout}`} onClick={handleLogout}>
          <span>↩</span>
          <span className={styles.mobileNavLabel}>Logout</span>
        </button>
      </nav>

      {/* Main content */}
      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
