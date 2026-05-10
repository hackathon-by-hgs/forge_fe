import { type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface PageShellProps {
  sidebar: ReactNode;
  topBar: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Constrained-viewport shell. Sidebar and TopBar are pinned for the lifetime
 * of the session; only `<main>` scrolls. The outer `h-screen overflow-hidden`
 * is what holds the sidebar in place — without it, the sidebar would scroll
 * with the document.
 */
export function PageShell({ sidebar, topBar, children, className }: PageShellProps) {
  return (
    <div className={cn('flex h-screen overflow-hidden bg-surface', className)}>
      {sidebar}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        {topBar}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
