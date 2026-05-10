import type { Config } from 'tailwindcss';

/**
 * Shared Tailwind preset — Forge brand v2 with dark mode support.
 *
 * Theme-aware colors are wired to CSS custom properties defined in
 * `packages/ui/src/styles.css`. Light values live in `:root`; dark values in
 * `.dark` (toggled by the ThemeProvider). The shape `rgb(var(--x) / <alpha>)`
 * preserves Tailwind's opacity modifier syntax (e.g. `bg-surface/80`).
 *
 * Brand surface tokens (aubergine — splash + auth only) stay STATIC. They
 * never appear on content screens, so no theme switching needed.
 */
const cssVar = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

export const forgePreset = {
  content: [],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ─── Warm neutrals (theme-aware) ──────────────────────────────────
        // Light: warm off-white → dark ink. Dark: dark surfaces → light ink.
        // The semantic of each shade stays the same in both modes:
        //   50 = surface, 100 = surface container, 900 = ink.
        neutral: {
          50: cssVar('--color-neutral-50'),
          100: cssVar('--color-neutral-100'),
          200: cssVar('--color-neutral-200'),
          300: cssVar('--color-neutral-300'),
          400: cssVar('--color-neutral-400'),
          500: cssVar('--color-neutral-500'),
          600: cssVar('--color-neutral-600'),
          700: cssVar('--color-neutral-700'),
          800: cssVar('--color-neutral-800'),
          900: cssVar('--color-neutral-900'),
          950: cssVar('--color-neutral-950'),
        },

        // ─── Semantic surface aliases (theme-aware) ───────────────────────
        surface: cssVar('--color-surface'),
        'surface-container': cssVar('--color-surface-container'),
        'surface-container-high': cssVar('--color-surface-container-high'),
        outline: cssVar('--color-outline'),
        'outline-variant': cssVar('--color-outline-variant'),
        ink: cssVar('--color-ink'),
        'ink-muted': cssVar('--color-ink-muted'),

        // ─── Accent (theme-aware) ─────────────────────────────────────────
        // Each app's tailwind.config defines its accent palette using the
        // same CSS-var pattern; light = deep teal, dark = bright teal.
        accent: {
          50: cssVar('--color-accent-50'),
          100: cssVar('--color-accent-100'),
          200: cssVar('--color-accent-200'),
          300: cssVar('--color-accent-300'),
          400: cssVar('--color-accent-400'),
          500: cssVar('--color-accent-500'),
          600: cssVar('--color-accent-600'),
          700: cssVar('--color-accent-700'),
          800: cssVar('--color-accent-800'),
          900: cssVar('--color-accent-900'),
        },

        // ─── Secondary (amber — earnings, money cues) ─────────────────────
        secondary: {
          50: cssVar('--color-secondary-50'),
          100: cssVar('--color-secondary-100'),
          200: cssVar('--color-secondary-200'),
          300: cssVar('--color-secondary-300'),
          400: cssVar('--color-secondary-400'),
          500: cssVar('--color-secondary-500'),
          600: cssVar('--color-secondary-600'),
          700: cssVar('--color-secondary-700'),
        },

        // ─── Status colors (theme-aware) ──────────────────────────────────
        success: {
          50: cssVar('--color-success-50'),
          100: cssVar('--color-success-100'),
          500: cssVar('--color-success-500'),
          600: cssVar('--color-success-600'),
          700: cssVar('--color-success-700'),
        },
        warning: {
          50: cssVar('--color-warning-50'),
          100: cssVar('--color-warning-100'),
          500: cssVar('--color-warning-500'),
          600: cssVar('--color-warning-600'),
          700: cssVar('--color-warning-700'),
        },
        danger: {
          50: cssVar('--color-danger-50'),
          100: cssVar('--color-danger-100'),
          500: cssVar('--color-danger-500'),
          600: cssVar('--color-danger-600'),
          700: cssVar('--color-danger-700'),
        },
        info: {
          50: cssVar('--color-info-50'),
          100: cssVar('--color-info-100'),
          500: cssVar('--color-info-500'),
          600: cssVar('--color-info-600'),
          700: cssVar('--color-info-700'),
        },

        // ─── Brand surface (aubergine, STATIC) ────────────────────────────
        // Splash + auth only. Never theme-switches.
        brand: {
          50: '#F5EDD8',           // foreground (warm cream)
          100: '#E8D9F2',
          200: '#B5A8C9',          // muted
          300: '#9B89B8',
          400: '#7B649F',
          500: '#5A3F88',          // surface high
          600: '#4D3279',          // surface
          700: '#3D2566',          // background
          800: '#2E1B4D',
          900: '#1F1233',
          glow: '#FFE9B8',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s ease-in-out infinite',
        'fade-in': 'fade-in 200ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Partial<Config>;

export default forgePreset;
