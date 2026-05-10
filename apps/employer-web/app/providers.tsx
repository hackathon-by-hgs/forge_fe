'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
      },
    },
  });
}

function BootSkeleton() {
  return (
    <div className="p-6">
      <div className="h-6 w-48 animate-pulse rounded bg-surface-container-high" />
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="h-32 animate-pulse rounded bg-surface-container-high" />
        <div className="h-32 animate-pulse rounded bg-surface-container-high" />
        <div className="h-32 animate-pulse rounded bg-surface-container-high" />
      </div>
    </div>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { booting, bootError, user, boot } = useAuth();

  useEffect(() => {
    void boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (booting) return;
    if (pathname === '/login') {
      if (user) router.replace('/');
      return;
    }
    if (!user) router.replace('/login');
  }, [booting, pathname, router, user]);

  if (pathname === '/login') {
    if (booting) return <BootSkeleton />;
    if (user) return <BootSkeleton />;
    return <>{children}</>;
  }

  if (booting) {
    return <BootSkeleton />;
  }

  if (bootError) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-outline bg-surface p-4">
          <p className="text-sm font-semibold text-ink">Couldn’t connect to Forge</p>
          <p className="mt-1 text-xs text-ink-muted">{bootError}</p>
          <button
            type="button"
            onClick={() => void boot()}
            className="mt-3 inline-flex h-9 items-center rounded-md bg-accent-600 px-3 text-sm font-medium text-white hover:bg-accent-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>{children}</AuthGate>
    </QueryClientProvider>
  );
}

