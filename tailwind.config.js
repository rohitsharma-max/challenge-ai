/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#7c3aed',
          light: '#9f5bff',
        },
        fire: '#ff6b35',
        gold: '#fbbf24',
        green: {
          streak: '#10b981',
        },
        red: {
          streak: '#ef4444',
        },
        blue: {
          streak: '#3b82f6',
        },
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          glass: 'var(--bg-glass)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 2px 8px rgba(0,0,0,0.3)',
        md: '0 4px 20px rgba(0,0,0,0.4)',
        lg: '0 8px 40px rgba(0,0,0,0.5)',
        accent: '0 0 30px rgba(124,58,237,0.2)',
        'accent-glow': '0 4px 20px rgba(124,58,237,0.3)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(124,58,237,0.3)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(124,58,237,0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
          '50%': { transform: 'translateY(-15px)', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
        },
        celebrationBurst: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'scale(2.5) rotate(180deg)', opacity: '0' },
        },
        progressFill: {
          from: { width: '0%' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
        'scale-in': 'scaleIn 0.3s ease forwards',
        'pulse-glow': 'pulseGlow 2s ease infinite',
        float: 'float 3s ease-in-out infinite',
        spin: 'spin 0.7s linear infinite',
        bounce: 'bounce 1s infinite',
        'celebration-burst': 'celebrationBurst 0.6s ease forwards',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
};