import type { Config } from 'tailwindcss';
import { forgePreset } from '@forge/ui/tailwind-preset';

/**
 * Bank dashboard — cool/financial accent (deep emerald).
 * Inherits all neutrals, status colors, typography from the shared preset.
 */
const config: Config = {
  presets: [forgePreset as Partial<Config>],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
      },
    },
  },
};

export default config;
