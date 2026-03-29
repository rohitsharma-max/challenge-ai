// src/app/(auth)/layout.js

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>
      {/* Orbs */}
      <div className="fixed pointer-events-none z-0"
        style={{ top: -150, left: -150, width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' }} />
      <div className="fixed pointer-events-none z-0"
        style={{ bottom: -100, right: -100, width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)' }} />

      {/* Card */}
      <div className="w-full max-w-[440px] relative z-10 rounded-3xl p-10 animate-scale-in"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl">⚡</span>
          <span className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Streakify</span>
        </div>
        {children}
      </div>
    </div>
  );
}
