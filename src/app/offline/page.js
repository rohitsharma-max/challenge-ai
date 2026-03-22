// src/app/offline/page.js
export default function OfflinePage() {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
                padding: '24px',
                textAlign: 'center',
            }}
        >
            <div
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '24px',
                    padding: '48px 40px',
                    maxWidth: '380px',
                    width: '100%',
                }}
            >
                <div style={{ fontSize: '56px', marginBottom: '20px' }}>📡</div>
                <h1
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '24px',
                        fontWeight: 800,
                        marginBottom: '12px',
                        color: 'var(--text-primary)',
                    }}
                >
                    You&apos;re offline
                </h1>
                <p
                    style={{
                        color: 'var(--text-secondary)',
                        fontSize: '15px',
                        lineHeight: 1.6,
                        marginBottom: '28px',
                    }}
                >
                    Your daily challenge is waiting. Connect to the internet to load it.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        background: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        padding: '14px 28px',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: '100%',
                    }}
                >
                    🔄 Try again
                </button>
            </div>
        </div>
    );
}