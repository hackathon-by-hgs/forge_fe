'use client';

import { cn } from '../utils/cn';

export interface RadialProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
  /** auto picks tone by score band; otherwise honor explicit tone. */
  tone?: 'auto' | 'accent' | 'success' | 'warning' | 'danger';
}

const TONE_CLS: Record<Exclude<RadialProgressProps['tone'], 'auto' | undefined>, string> = {
  accent: 'text-accent-500',
  success: 'text-success-600',
  warning: 'text-warning-500',
  danger: 'text-danger-500',
};

function autoTone(pct: number): Exclude<RadialProgressProps['tone'], 'auto' | undefined> {
  if (pct >= 0.8) return 'success';
  if (pct >= 0.6) return 'accent';
  if (pct >= 0.4) return 'warning';
  return 'danger';
}

export function RadialProgress({
  value,
  max = 100,
  size = 160,
  strokeWidth = 12,
  label,
  className,
  tone = 'auto',
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value / max));
  const offset = circumference * (1 - pct);
  const resolvedTone = tone === 'auto' ? autoTone(pct) : tone;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-neutral-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={cn('transition-all duration-500', TONE_CLS[resolvedTone])}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums text-neutral-900" data-numeric>
          {Math.round(value)}
        </span>
        {label ? <span className="text-xs text-neutral-500">{label}</span> : null}
      </div>
    </div>
  );
}
