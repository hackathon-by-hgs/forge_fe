import { type ReactNode } from 'react';
import { cn } from '../utils/cn';
import type { StatusTone } from '@forge/types';

export interface AlertBannerProps {
  tone?: Extract<StatusTone, 'warning' | 'danger' | 'info' | 'success'>;
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const TONE: Record<NonNullable<AlertBannerProps['tone']>, string> = {
  warning: 'bg-warning-50 border-warning-500/30 text-warning-700',
  danger: 'bg-danger-50 border-danger-500/30 text-danger-700',
  info: 'bg-info-50 border-info-500/30 text-info-700',
  success: 'bg-success-50 border-success-500/30 text-success-700',
};

export function AlertBanner({
  tone = 'info',
  icon,
  title,
  description,
  action,
  onDismiss,
  className,
}: AlertBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
        TONE[tone],
        className,
      )}
    >
      {icon ? <div className="mt-0.5 shrink-0">{icon}</div> : null}
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="mt-0.5 text-xs opacity-90">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="ml-auto shrink-0 rounded p-1 hover:bg-black/5"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
