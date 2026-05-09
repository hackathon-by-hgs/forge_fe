import type { Config } from 'tailwindcss';
import { forgePreset } from '@forge/ui/tailwind-preset';

/**
 * Employer dashboard — warm/operational accent (amber-orange).
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
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
      },
    },
  },
};

export default config;
