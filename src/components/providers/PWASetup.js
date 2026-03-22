// src/components/PWASetup.js
// Drop this into your root layout — handles SW registration + install prompt
'use client';

import { useEffect, useState } from 'react';

export default function PWASetup() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js', { scope: '/' })
                .then((reg) => {
                    console.log('[PWA] Service worker registered:', reg.scope);
                })
                .catch((err) => {
                    console.error('[PWA] Service worker registration failed:', err);
                });
        }

        // Check if already installed (running as standalone)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Capture the install prompt event (Chrome/Edge Android)
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setInstallPrompt(e);

            // Only show banner if not dismissed before
            const dismissed = localStorage.getItem('pwa-banner-dismissed');
            if (!dismissed) {
                setTimeout(() => setShowBanner(true), 3000); // show after 3s
            }
        };

        // Detect if app was installed
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowBanner(false);
            setInstallPrompt(null);
            console.log('[PWA] App installed!');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstalled(true);
            setShowBanner(false);
        }
        setInstallPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa-banner-dismissed', '1');
    };

    if (!showBanner || isInstalled) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                padding: '12px 16px',
                background: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
                animation: 'slideUp 0.4s ease forwards',
            }}
        >
            {/* App icon */}
            <div
                style={{
                    width: 44,
                    height: 44,
                    background: 'var(--accent)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                    boxShadow: '0 4px 12px var(--accent-glow)',
                }}
            >
                ⚡
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p
                    style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 2,
                        fontFamily: 'var(--font-display)',
                    }}
                >
                    Install DailyAI
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Add to home screen for the best experience
                </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                    onClick={handleDismiss}
                    style={{
                        padding: '8px 12px',
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                    }}
                >
                    Later
                </button>
                <button
                    onClick={handleInstall}
                    style={{
                        padding: '8px 14px',
                        background: 'var(--accent)',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'white',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        boxShadow: '0 2px 8px var(--accent-glow)',
                    }}
                >
                    Install
                </button>
            </div>
        </div>
    );
}