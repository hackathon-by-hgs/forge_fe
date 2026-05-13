'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface RoutedTab {
  label: string;
  href: string;
  badge?: ReactNode;
  /** When true, the tab is only active on exact pathname match. Useful for an
   * "All" parent tab that would otherwise prefix-match every child route. */
  exact?: boolean;
}

export interface RoutedTabsProps {
  items: readonly RoutedTab[];
  className?: string;
}

/**
 * URL-routed tab strip. Picks the matching tab via `usePathname` so each
 * sub-page can navigate without local state.
 */
export function RoutedTabs({ items, className }: RoutedTabsProps) {
  const pathname = usePathname() ?? '/';
  return (
    <nav
      className={cn(
        'inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-200 bg-white p-0.5',
        className,
      )}
      aria-label="Section tabs"
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
              active
                ? 'bg-neutral-100 text-neutral-900'
                : 'text-neutral-600 hover:text-neutral-900',
            )}
          >
            {item.label}
            {item.badge ? <span className="text-neutral-400">{item.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
