'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';
import { AUTH_LOGIN_PATH, isPublicAuthRoute, safeAuthReturnPath } from '../lib/publicRoutes';

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

function StreamSubscriber() {
  const user = useAuth((s) => s.user);
  useForgeStream(Boolean(user));
  return null;
}

function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { booting, bootError, user, boot } = useAuth();

  useEffect(() => {
    if (isPublicAuthRoute(pathname)) return;
    void boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (isPublicAuthRoute(pathname)) {
      if (user && (pathname === AUTH_LOGIN_PATH || pathname === '/signup/business')) {
        const next =
          typeof window !== 'undefined'
            ? safeAuthReturnPath(new URLSearchParams(window.location.search).get('next'))
            : null;
        router.replace(next ?? '/');
      }
      return;
    }
    if (!booting && !user && !bootError) {
      const returnTo =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : pathname;
      const next = safeAuthReturnPath(returnTo);
      const dest = next
        ? `${AUTH_LOGIN_PATH}?${new URLSearchParams({ next }).toString()}`
        : AUTH_LOGIN_PATH;
      router.replace(dest);
    }
  }, [bootError, booting, pathname, router, user]);

  if (isPublicAuthRoute(pathname)) {
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

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6">
        <p className="text-sm text-ink-muted">Redirecting to sign in…</p>
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
