import { type ReactNode } from 'react';
import { cn } from '../utils/cn';
import type { StatusTone } from '@forge/types';

export interface TimelineItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  timestamp?: string;
  tone?: StatusTone;
  icon?: ReactNode;
}

export interface TimelineProps {
  items: readonly TimelineItem[];
  className?: string;
}

const TONE_BG: Record<StatusTone, string> = {
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
  info: 'bg-info-100 text-info-700',
  neutral: 'bg-neutral-100 text-neutral-600',
};

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn('relative space-y-4', className)}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <li key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full',
                  TONE_BG[item.tone ?? 'neutral'],
                )}
              >
                {item.icon ?? <span className="h-2 w-2 rounded-full bg-current" />}
              </div>
              {isLast ? null : <div className="mt-1 w-px flex-1 bg-neutral-200" />}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                {item.timestamp ? (
                  <span className="text-xs text-neutral-500">{item.timestamp}</span>
                ) : null}
              </div>
              {item.description ? (
                <p className="mt-0.5 text-xs text-neutral-500">{item.description}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
