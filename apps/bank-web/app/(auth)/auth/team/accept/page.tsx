'use client';

import Link from 'next/link';
import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertBanner, Button, Card, CardBody, CardHeader, CardTitle, FormField, Input } from '@forge/ui';
import { IconBank } from '@forge/ui/icons';
import { acceptInvitation } from '../../../../../lib/api/auth';
import { ApiError, toUserMessage } from '../../../../../lib/api/errors';
import { useAuthStore } from '../../../../../lib/auth/store';
import { isBankRole } from '../../../../../lib/api/types';
import { setAccessToken } from '../../../../../lib/auth/tokenStore';

function Brand() {
  return (
    <div className="mb-8 flex flex-col items-center gap-3">
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

function TeamAcceptForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');

  const { applyLoginResponse, signOut } = useAuthStore((s) => ({
    applyLoginResponse: s.applyLoginResponse,
    signOut: s.signOut,
  }));

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{ fullName?: string; password?: string }>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setFieldErr({});

    if (!token) {
      setError('Missing invitation token. Please use the link from your email.');
      return;
    }
    if (fullName.trim().length < 2) {
      setFieldErr({ fullName: 'Enter your full name.' });
      return;
    }
    if (password.length < 10) {
      setFieldErr({ password: 'Use at least 10 characters.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await acceptInvitation({ token, fullName: fullName.trim(), password });
      if (!isBankRole(res.user.role)) {
        // Cross-domain miss: an employer invite link opened on bank-web.
        // Clear the freshly-issued session and tell the user where to go.
        setAccessToken(null);
        await signOut();
        setError(
          "This invitation isn't for the bank dashboard. Open the link from a Forge employer email instead.",
        );
        return;
      }
      applyLoginResponse(res);
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVITATION_INVALID') {
        setError('This invitation has expired or already been used.');
      } else if (err instanceof ApiError && err.code === 'EMAIL_ALREADY_REGISTERED') {
        setError('An account already exists for the email this invite was sent to. Sign in instead.');
      } else {
        setError(toUserMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center space-y-2 px-6 py-10">
      <Brand />
      <Card>
        <CardHeader>
          <CardTitle>Accept team invitation</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-xs text-ink-muted">
            You&apos;ve been invited to a bank workspace on Forge. Set up your
            account to join.
          </p>
          <form onSubmit={submit} className="space-y-4" noValidate>
            {error ? <AlertBanner tone="danger" title={error} /> : null}
            <FormField
              label="Full name"
              htmlFor="fullName"
              error={fieldErr.fullName}
            >
              <Input
                id="fullName"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                invalid={!!fieldErr.fullName}
                disabled={submitting}
                autoFocus
                required
              />
            </FormField>
            <FormField
              label="Choose a password"
              htmlFor="password"
              error={fieldErr.password}
            >
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                invalid={!!fieldErr.password}
                disabled={submitting}
                required
              />
            </FormField>
            <Button
              type="submit"
              className="w-full"
              loading={submitting}
              disabled={submitting}
            >
              Join team
            </Button>
          </form>
          <p className="text-center text-sm">
            <Link
              href="/login"
              className="font-medium text-accent-600 hover:text-accent-700"
            >
              Back to sign in
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

export default function TeamAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6 py-10 text-center text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <TeamAcceptForm />
    </Suspense>
  );
}
