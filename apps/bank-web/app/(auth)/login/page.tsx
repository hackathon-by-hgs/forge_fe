'use client';

import Link from 'next/link';
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertBanner, Button, FormField, Input } from '@forge/ui';
import { IconBank, IconShield, IconCheck, IconTrendUp } from '@forge/ui/icons';
import { ApiError, toUserMessage } from '../../../lib/api/errors';
import { useAuthStore } from '../../../lib/auth/store';
import { isBankRole } from '../../../lib/api/types';

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr] xl:grid-cols-[1.1fr_1fr]">
      <BrandPanel />
      <FormPanel />
    </div>
  );
}

/* ─────────────────────────────  Form panel  ──────────────────────────── */

function FormPanel() {
  return (
    <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
      <div className="w-full max-w-[420px]">
        <Suspense fallback={<FormPanelSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}

function FormPanelSkeleton() {
  return (
    <div className="animate-auth-fade space-y-7" aria-hidden>
      {/* <CompactBrand /> */}
      <div className="space-y-2">
        <div className="h-7 w-44 rounded-md bg-surface-container" />
        <div className="h-4 w-72 max-w-full rounded-md bg-surface-container/70" />
      </div>
      <div className="space-y-5">
        <div className="space-y-1.5">
          <div className="h-3 w-20 rounded bg-surface-container/70" />
          <div className="h-10 w-full rounded-lg bg-surface-container" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-20 rounded bg-surface-container/70" />
          <div className="h-10 w-full rounded-lg bg-surface-container" />
        </div>
        <div className="h-10 w-full rounded-lg bg-accent-500/60" />
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();

  const { bootStatus, login, signOut, bootNetworkError, retryBoot } = useAuthStore(
    (s) => ({
      bootStatus: s.bootStatus,
      login: s.login,
      signOut: s.signOut,
      bootNetworkError: s.bootNetworkError,
      retryBoot: s.retryBoot,
    }),
  );

  const redirectTo = useMemo(() => {
    const from = search.get('from');
    if (!from || !from.startsWith('/') || from.startsWith('//')) return '/';
    return from;
  }, [search]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: boolean;
    password?: boolean;
  }>({});

  useEffect(() => {
    if (bootStatus === 'authenticated') router.replace(redirectTo);
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
    <div className="space-y-7">
      <CompactBrand />

      {bootNetworkError ? (
        <div
          className="animate-auth-rise"
          style={{ animationDelay: '60ms' }}
        >
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
        </div>
      ) : null}

      <header
        className="animate-auth-rise space-y-1.5"
        style={{ animationDelay: '80ms' }}
      >
        <h1 className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.022em] text-ink sm:text-[2rem]">
          Welcome back
        </h1>
        <p className="text-[15px] leading-relaxed tracking-[-0.005em] text-ink-muted">
          Sign in with your work email to continue to the bank dashboard.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-5" noValidate aria-busy={submitting}>
        {error ? (
          <div
            role="alert"
            aria-live="polite"
            className="animate-auth-rise"
            style={{ animationDelay: '0ms' }}
          >
            <AlertBanner tone="danger" title={error} />
          </div>
        ) : null}

        <div
          className="animate-auth-rise"
          style={{ animationDelay: '140ms' }}
        >
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
        </div>

        <div
          className="animate-auth-rise flex flex-col gap-1.5"
          style={{ animationDelay: '200ms' }}
        >
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-medium text-neutral-700"
            >
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium text-accent-500 transition-colors hover:text-accent-600 focus-visible:outline-none focus-visible:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              invalid={fieldErrors.password}
              disabled={submitting}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 my-1 mr-1 flex w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-container hover:text-ink focus-visible:bg-surface-container focus-visible:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        <div
          className="animate-auth-rise pt-1"
          style={{ animationDelay: '260ms' }}
        >
          <Button
            type="submit"
            size="lg"
            className="w-full shadow-[0_8px_24px_-12px_rgb(var(--color-accent-500)/0.55)] transition-all duration-200 hover:shadow-[0_12px_28px_-10px_rgb(var(--color-accent-500)/0.65)] active:translate-y-px"
            loading={submitting}
            disabled={submitting}
            trailingIcon={
              submitting ? null : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                >
                  <path d="M5 12h14" />
                  <path d="m13 5 7 7-7 7" />
                </svg>
              )
            }
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>

        <p
          className="animate-auth-rise text-center text-xs leading-relaxed text-ink-muted"
          style={{ animationDelay: '320ms' }}
        >
          Don&apos;t have access?{' '}
          <span className="font-medium text-ink">Ask your bank administrator</span>{' '}
          to invite you.
        </p>
      </form>

      {process.env.NODE_ENV === 'development' ? (
        <div
          className="animate-auth-rise"
          style={{ animationDelay: '380ms' }}
        >
          <DevHints
            onPick={(e, p) => {
              setEmail(e);
              setPassword(p);
            }}
          />
        </div>
      ) : null}

      <p
        className="animate-auth-fade text-center text-[11px] leading-relaxed text-ink-muted"
        style={{ animationDelay: '440ms' }}
      >
        By continuing you agree to Forge&apos;s{' '}
        <span className="underline-offset-2 hover:underline">Terms</span> and{' '}
        <span className="underline-offset-2 hover:underline">Privacy Policy</span>.
      </p>
    </div>
  );
}

/* ──────────────────────────────  Brand  ─────────────────────────────── */

function CompactBrand() {
  return (
    <div className="flex items-center gap-3 lg:hidden">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white shadow-[0_8px_22px_-10px_rgb(var(--color-accent-500)/0.7)]">
        <IconBank className="!h-5 !w-5" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-ink">Forge Lender</p>
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          Bank dashboard
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────  Brand panel  ────────────────────────── */

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden border-r border-outline/60 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-14">
      {/* <PanelBackdrop /> */}

      <div className="relative z-10 flex items-center gap-3">
        <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500 text-white shadow-[0_10px_30px_-12px_rgb(var(--color-accent-500)/0.75)]">
          <span
            aria-hidden
            className="animate-auth-pulse absolute inset-0 rounded-xl bg-accent-500/40 blur-md"
          />
          <IconBank className="relative !h-5 !w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink">Forge Lender</p>
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">
            Bank dashboard
          </p>
        </div>
      </div>

      <div className="relative z-10 max-w-[34rem] space-y-10">
        <div className="space-y-5">
          <span
            className="animate-auth-rise inline-flex items-center gap-2 rounded-full border border-outline/60 bg-surface-container/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted backdrop-blur"
            style={{ animationDelay: '40ms' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            Credit · Risk · Portfolio
          </span>

          <h2
            className="animate-auth-rise text-balance text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.035em] text-ink xl:text-[3rem]"
            style={{ animationDelay: '120ms' }}
          >
            Decide with{' '}
            <span className="text-black dark:text-white">
              confidence.
            </span>
          </h2>

          <p
            className="animate-auth-rise max-w-[28rem] text-pretty text-base leading-relaxed text-ink-muted"
            style={{ animationDelay: '200ms' }}
          >
            A unified workspace for credit officers and risk analysts —
            real-time portfolio signals, instant decisioning, and the audit
            trail your team trusts.
          </p>
        </div>

        <ul className="space-y-3.5">
          <FeatureRow
            delay={280}
            icon={<IconTrendUp className="!h-[18px] !w-[18px]" />}
            title="Live portfolio signals"
            description="Spot at-risk loans the moment they drift, not after month-end."
          />
          <FeatureRow
            delay={340}
            icon={<IconShield className="!h-[18px] !w-[18px]" />}
            title="Audit-grade decisioning"
            description="Every approval, override, and policy edit captured by default."
          />
          <FeatureRow
            delay={400}
            icon={<IconCheck className="!h-[18px] !w-[18px]" />}
            title="Built for two roles"
            description="Credit Officers act. Risk Analysts oversee. Same source of truth."
          />
        </ul>
      </div>
    </aside>
  );
}


function FeatureRow({
  icon,
  title,
  description,
  delay,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <li
      className="animate-auth-rise group flex items-start gap-3.5 rounded-xl p-2.5 transition-colors hover:bg-surface-container/60"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline/70 bg-surface text-accent-500 shadow-sm transition-all duration-200 group-hover:-translate-y-px group-hover:border-accent-500/30 group-hover:shadow-[0_6px_18px_-10px_rgb(var(--color-accent-500)/0.5)]">
        {icon}
      </span>
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-[13px] leading-relaxed text-ink-muted">{description}</p>
      </div>
    </li>
  );
}

/* ──────────────────────────────  Icons  ─────────────────────────────── */

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.88 5.12A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a18.45 18.45 0 0 1-3.36 4.36" />
      <path d="M6.61 6.61A18.5 18.5 0 0 0 2 12s3.5 7 10 7a10.94 10.94 0 0 0 5.39-1.39" />
      <path d="M9.9 9.9A3 3 0 0 0 14.1 14.1" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

/* ─────────────────────────────  Dev hints  ──────────────────────────── */

const DEMO_LOGINS: Array<{ label: string; role: string; email: string; password: string }> = [
  {
    label: 'Credit Officer',
    role: 'Full lending access',
    email: 'credit+bnk_gtbank@example.ng',
    password: 'forge-demo-pass',
  },
  {
    label: 'Risk Analyst',
    role: 'Read-only oversight',
    email: 'risk+bnk_gtbank@example.ng',
    password: 'forge-demo-pass',
  },
];

function DevHints({ onPick }: { onPick: (email: string, password: string) => void }) {
  return (
    <div className="rounded-xl border border-info-500/25 bg-info-50/50 p-3.5 backdrop-blur-sm dark:bg-info-50/30">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="inline-flex h-5 items-center rounded-full bg-info-500/15 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-info-700 dark:text-info-600">
          Dev
        </span>
        <p className="text-xs font-semibold text-info-700 dark:text-info-600">
          Demo logins
        </p>
      </div>
      <ul className="space-y-1.5">
        {DEMO_LOGINS.map((demo) => (
          <li key={demo.email}>
            <button
              type="button"
              onClick={() => onPick(demo.email, demo.password)}
              className="group flex w-full items-center justify-between gap-3 rounded-lg border border-info-500/20 bg-surface/60 px-3 py-2 text-left transition-all duration-150 hover:-translate-y-px hover:border-info-500/40 hover:bg-surface hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500/40"
            >
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-ink">
                  {demo.label}
                </span>
                <span className="block truncate text-[11px] text-ink-muted">
                  {demo.role} · {demo.email}
                </span>
              </span>
              <span className="shrink-0 text-[11px] font-medium text-info-700 opacity-0 transition-opacity group-hover:opacity-100 dark:text-info-600">
                Use →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
