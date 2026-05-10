'use client';

import { Suspense, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertBanner,
  Button,
  FormField,
  Input,
} from '@forge/ui';
import { IconBank } from '@forge/ui/icons';
import { ApiError, toUserMessage } from '../../../lib/api/errors';
import { useAuthStore } from '../../../lib/auth/store';
import { isBankRole } from '../../../lib/api/types';

export default function LoginPage() {
  return (
    <Suspense fallback={<Brand />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();

  const { bootStatus, login, signOut, bootNetworkError, retryBoot } = useAuthStore((s) => ({
    bootStatus: s.bootStatus,
    login: s.login,
    signOut: s.signOut,
    bootNetworkError: s.bootNetworkError,
    retryBoot: s.retryBoot,
  }));

  const redirectTo = useMemo(() => {
    const from = search.get('from');
    if (!from || !from.startsWith('/') || from.startsWith('//')) return '/';
    return from;
  }, [search]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: boolean;
    password?: boolean;
  }>({});

  // If a previously-signed-in tab dropped us here without `?from`, and
  // boot already concluded we're authenticated, fall back to `/`.
  useEffect(() => {
    if (bootStatus === 'authenticated') {
      router.replace(redirectTo);
    }
  }, [bootStatus, redirectTo, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setFieldErrors({});

    if (!email || !password) {
      setFieldErrors({ email: !email, password: !password });
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login({ email, password });
      if (!isBankRole(res.user.role)) {
        // Successful auth, but wrong product. Drop the session and explain.
        await signOut();
        setError(
          "This account isn't authorized for the bank dashboard. Please use a Credit Officer or Risk Analyst account.",
        );
        return;
      }
      router.replace(redirectTo);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_CREDENTIALS') {
        setFieldErrors({ email: true, password: true });
      }
      setError(toUserMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Brand />

      {bootNetworkError ? (
        <AlertBanner
          tone="warning"
          title="Cannot verify your session — Forge may be unreachable."
          description="Retry connects to the API without signing you out."
          action={
            <Button variant="secondary" size="sm" onClick={() => void retryBoot()}>
              Retry
            </Button>
          }
        />
      ) : null}

      <form onSubmit={submit} className="space-y-5" noValidate>
        <header className="space-y-1">
          <h1 className="text-xl font-semibold text-ink">Sign in to your dashboard</h1>
          <p className="text-sm text-ink-muted">
            Use your work email and the password your administrator issued.
          </p>
        </header>

        {error ? <AlertBanner tone="danger" title={error} /> : null}

        <FormField label="Work email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@bank.ng"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={fieldErrors.email}
            disabled={submitting}
          />
        </FormField>

        <FormField label="Password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={fieldErrors.password}
            disabled={submitting}
          />
        </FormField>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={submitting}
          disabled={submitting}
        >
          Sign in
        </Button>

        <p className="text-center text-xs text-ink-muted">
          Don&apos;t have access?{' '}
          <span className="font-medium text-ink">Ask your bank administrator</span> to
          invite you. Self-signup for bank staff isn&apos;t available yet.
        </p>
      </form>

      {process.env.NODE_ENV === 'development' ? <DevHints onPick={(e, p) => {
        setEmail(e);
        setPassword(p);
      }} /> : null}

      <p className="text-center text-xs text-ink-muted">
        By continuing you agree to Forge&apos;s Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500 text-white">
        <IconBank className="!h-5 !w-5" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-ink">Forge Lender</p>
        <p className="mt-0.5 text-xs uppercase tracking-wider text-ink-muted">
          Bank dashboard
        </p>
      </div>
    </div>
  );
}

const DEMO_LOGINS: Array<{ label: string; email: string; password: string }> = [
  {
    label: 'Credit Officer (full lending)',
    email: 'credit+bnk_gtbank@example.ng',
    password: 'forge-demo-pass',
  },
  {
    label: 'Risk Analyst (read-only)',
    email: 'risk+bnk_gtbank@example.ng',
    password: 'forge-demo-pass',
  },
];

function DevHints({ onPick }: { onPick: (email: string, password: string) => void }) {
  return (
    <div className="rounded-lg border border-info-500/30 bg-info-50/40 p-3 text-xs text-info-700">
      <p className="font-semibold">Demo logins (dev only)</p>
      <ul className="mt-2 space-y-1.5">
        {DEMO_LOGINS.map((demo) => (
          <li key={demo.email} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{demo.label}</p>
              <p className="truncate font-mono text-[10px] opacity-80">{demo.email}</p>
            </div>
            <button
              type="button"
              onClick={() => onPick(demo.email, demo.password)}
              className="shrink-0 rounded-md border border-info-500/40 px-2 py-1 font-medium text-info-700 hover:bg-info-50"
            >
              Use
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
