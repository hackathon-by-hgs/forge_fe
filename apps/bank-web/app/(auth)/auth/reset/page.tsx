'use client';

import Link from 'next/link';
import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertBanner, Button, Card, CardBody, CardHeader, CardTitle, FormField, Input } from '@forge/ui';
import { IconBank } from '@forge/ui/icons';
import { resetPassword } from '../../../../lib/api/auth';
import { ApiError, toUserMessage } from '../../../../lib/api/errors';

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

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{
    password?: string;
    confirm?: string;
  }>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setFieldErr({});

    if (!token) {
      setError('Missing reset token. Please use the link from your email.');
      return;
    }
    if (password.length < 10) {
      setFieldErr({ password: 'Use at least 10 characters.' });
      return;
    }
    if (password !== confirm) {
      setFieldErr({ confirm: 'Passwords must match.' });
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({ token, newPassword: password });
      router.replace('/login?reset=1');
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'TOKEN_INVALID' || err.code === 'TOKEN_EXPIRED')) {
        setError('This reset link is invalid or has expired. Request a new one.');
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
          <CardTitle>Set a new password</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <form onSubmit={submit} className="space-y-4" noValidate>
            {error ? <AlertBanner tone="danger" title={error} /> : null}
            <FormField
              label="New password"
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
            <FormField
              label="Confirm password"
              htmlFor="confirm"
              error={fieldErr.confirm}
            >
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                invalid={!!fieldErr.confirm}
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
              Update password
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6 py-10 text-center text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
