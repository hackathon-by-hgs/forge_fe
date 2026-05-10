'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isPublicAuthRoute } from '../lib/publicRoutes';
import { AppShell } from './AppShell';

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isPublicAuthRoute(pathname)) {
    return <>{children}</>;
  }
  return <AppShell>{children}</AppShell>;
}
