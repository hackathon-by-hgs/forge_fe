'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Spinner } from '@forge/ui';
import { useAuthStore } from './store';
import { isBankRole } from '../api/types';
import { useForgeStream } from '../sse';

/**
 * Client-side gate for the `(app)` route group.
 *
 * Route protection cannot live in Next middleware: the refresh cookie
 * is `HttpOnly`, scoped to `/v1/dashboard/auth`, and lives on the BE
 * origin — the FE server never sees it (FRONTEND_INTEGRATION.md §2.3).
 *
 * Behaviour:
 *   - `pending` + network failure → full-screen retry (§2.3) — do not redirect
 *   - `pending`        → full-screen spinner (boot in flight)
 *   - `unauthenticated`→ redirect to `/login?from=<original>`
 *   - `authenticated`  → render children, but block non-bank roles
 *     with an "access denied" panel rather than crashing the dashboard.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { bootStatus, user, bootNetworkError } = useAuthStore((s) => ({
    bootStatus: s.bootStatus,
    user: s.user,
    bootNetworkError: s.bootNetworkError,
  }));

  useEffect(() => {
    if (bootStatus === 'unauthenticated') {
      const target = `/login?from=${encodeURIComponent(pathname || '/')}`;
      router.replace(target);
    }
  }, [bootStatus, pathname, router]);

  if (bootStatus === 'pending' && bootNetworkError) {
    return <BootOfflinePanel />;
  }

  if (bootStatus !== 'authenticated' || !user) {
    return <FullScreenSpinner label="Loading your dashboard…" />;
  }

  if (!isBankRole(user.role)) {
    return <RoleMismatchPanel role={user.role} />;
  }

  return (
    <>
      <StreamSubscriber />
      {children}
    </>
  );
}

function StreamSubscriber() {
  useForgeStream(true);
  return null;
}

function BootOfflinePanel() {
  const retryBoot = useAuthStore((s) => s.retryBoot);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center text-ink">
      <p className="text-lg font-semibold">Can&apos;t reach Forge</p>
      <p className="max-w-sm text-sm text-ink-muted">
        Your session may still be valid — check your connection and try again. We won&apos;t sign you out
        until the server confirms you&apos;re unauthorized (FRONTEND_INTEGRATION.md §2.3).
      </p>
      <Button variant="secondary" onClick={() => void retryBoot()}>
        Retry connection
      </Button>
    </div>
  );
}

function FullScreenSpinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface text-ink">
      <div className="flex flex-col items-center gap-3">
        <Spinner />
        <p className="text-xs text-ink-muted">{label}</p>
      </div>
    </div>
  );
}

function RoleMismatchPanel({ role }: { role: string }) {
  const signOut = useAuthStore((s) => s.signOut);
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 text-ink">
      <div className="max-w-md space-y-4 rounded-xl border border-outline bg-surface-container p-6 text-center">
        <h1 className="text-lg font-semibold">This isn&apos;t your dashboard</h1>
        <p className="text-sm text-ink-muted">
          The Forge bank dashboard is for <span className="font-medium">Credit Officers</span>{' '}
          and <span className="font-medium">Risk Analysts</span>. Your account is signed in
          as <span className="font-mono text-xs">{role}</span>.
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-sm font-medium text-accent-600 hover:text-accent-700"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
