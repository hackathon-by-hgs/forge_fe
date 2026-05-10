import type { Config } from 'tailwindcss';
import { forgePreset } from '@forge/ui/tailwind-preset';

/**
 * Bank dashboard. All colors (including accent) are theme-aware via
 * CSS variables defined in `@forge/ui/styles.css`. Both employer and bank
 * share the same Forge content palette — no per-app accent override.
 */
const config: Config = {
  presets: [forgePreset as Partial<Config>],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
