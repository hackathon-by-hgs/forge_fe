import { type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface PageShellProps {
  sidebar: ReactNode;
  topBar: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageShell({ sidebar, topBar, children, className }: PageShellProps) {
  return (
    <div className={cn('flex min-h-screen bg-neutral-50', className)}>
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {topBar}
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
