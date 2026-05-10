'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from '../api/queryClient';
import { useAuthStore } from './store';

/**
 * Top-level client provider.
 *
 *   - Owns the per-app QueryClient instance (see §2.4).
 *   - Triggers the boot refresh once on mount (see §2.3).
 *
 * Mounted from the root `app/layout.tsx`, so anything below — login or
 * dashboard — has both React Query and a hydrated auth store.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());
  const boot = useAuthStore((s) => s.boot);

  useEffect(() => {
    void boot();
  }, [boot]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
