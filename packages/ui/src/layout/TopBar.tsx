import { type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface TopBarProps {
  search?: ReactNode;
  /** Right-aligned cluster: notifications, environment switcher, account menu, etc. */
  end?: ReactNode;
  className?: string;
}

export function TopBar({ search, end, className }: TopBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-outline bg-surface-container/80 px-6 backdrop-blur',
        className,
      )}
    >
      <div className="min-w-0 flex-1">{search}</div>
      <div className="flex items-center gap-2">{end}</div>
    </header>
  );
}
