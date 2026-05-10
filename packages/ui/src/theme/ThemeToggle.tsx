'use client';

import { useTheme, type Theme } from './ThemeProvider';
import { cn } from '../utils/cn';
import IconSun from '@mui/icons-material/LightModeOutlined';
import IconMoon from '@mui/icons-material/DarkModeOutlined';
import IconSystem from '@mui/icons-material/SettingsBrightnessOutlined';

const OPTIONS: { value: Theme; label: string; Icon: typeof IconSun }[] = [
  { value: 'light', label: 'Light', Icon: IconSun },
  { value: 'system', label: 'System', Icon: IconSystem },
  { value: 'dark', label: 'Dark', Icon: IconMoon },
];

/**
 * Three-way segmented control for Light / System / Dark. Drop into a settings
 * panel or account menu.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-outline bg-surface p-0.5',
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors',
              active
                ? 'bg-surface-container-high text-ink'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            <Icon className="!h-3.5 !w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
