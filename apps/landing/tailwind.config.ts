import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        forge: {
          black: '#000000',
          dark: '#0a0a0a',
          card: '#111111',
          border: 'rgba(255,255,255,0.08)',
          muted: '#666666',
          accent: '#FF4D00',
          'accent-hover': '#FF6A2A',
          light: '#F5F5F0',
          'light-alt': '#EEEEE8',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        /* Phenomenon uses massive display type — 8vw+ on desktop */
        'hero': ['clamp(3.5rem, 8vw, 9rem)', { lineHeight: '0.95', letterSpacing: '-0.04em', fontWeight: '800' }],
        'display': ['clamp(2.5rem, 5vw, 5.5rem)', { lineHeight: '1.0', letterSpacing: '-0.03em', fontWeight: '700' }],
        'heading': ['clamp(1.5rem, 3vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'body-lg': ['clamp(1rem, 1.25vw, 1.25rem)', { lineHeight: '1.6', fontWeight: '400' }],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'marquee': 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
