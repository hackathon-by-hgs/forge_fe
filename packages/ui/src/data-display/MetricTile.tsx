import { type ReactNode } from 'react';
import { cn } from '../utils/cn';
import { Sparkline } from './Sparkline';
import type { Trend } from '@forge/types';

export interface MetricTileProps {
  label: string;
  value: ReactNode;
  delta?: { pct: number; direction: Trend; label?: string };
  trend?: number[];
  hint?: string;
  size?: 'default' | 'hero';
  className?: string;
}

export function MetricTile({
  label,
  value,
  delta,
  trend,
  hint,
  size = 'default',
  className,
}: MetricTileProps) {
  const deltaTone =
    delta?.direction === 'up'
      ? 'text-success-600'
      : delta?.direction === 'down'
        ? 'text-danger-600'
        : 'text-neutral-500';

  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-200 bg-white p-5',
        'transition-colors hover:border-neutral-300',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {label}
        </p>
        {trend && trend.length > 0 ? (
          <Sparkline data={trend} width={80} height={24} tone="auto" />
        ) : null}
      </div>
      <div
        data-numeric
        className={cn(
          'mt-3 font-semibold text-neutral-900',
          size === 'hero' ? 'text-4xl' : 'text-3xl',
        )}
      >
        {value}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta ? (
          <span className={cn('font-medium tabular-nums', deltaTone)} data-numeric>
            {delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '→'}{' '}
            {Math.abs(delta.pct).toFixed(1)}%
            {delta.label ? <span className="ml-1 text-neutral-500">{delta.label}</span> : null}
          </span>
        ) : null}
        {hint ? <span className="text-neutral-500">{hint}</span> : null}
      </div>
    </div>
  );
}
