'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { AlertBanner, Button, Card, CardBody, CardHeader, CardTitle, FormField, Input } from '@forge/ui';
import { IconBank } from '@forge/ui/icons';
import { forgotPassword } from '../../../../lib/api/auth';
import { NetworkError, toUserMessage } from '../../../../lib/api/errors';

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !email) return;
    setSubmitting(true);
    setNetworkError(null);
    try {
      await forgotPassword({ email });
      setDone(true);
    } catch (err) {
      // Forgot endpoint always 204 by design — only surface transport errors.
      if (err instanceof NetworkError) {
        setNetworkError(toUserMessage(err));
      } else {
        // Treat as success regardless — don't leak existence.
        setDone(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Brand />
      <Card>
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {done ? (
            <p className="text-sm text-ink-muted">
              If that email exists in Forge, we sent a reset link. Check your
              inbox (and spam).
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              {networkError ? (
                <AlertBanner tone="warning" title={networkError} />
              ) : null}
              <FormField label="Work email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@bank.ng"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  required
                />
              </FormField>
              <Button
                type="submit"
                className="w-full"
                loading={submitting}
                disabled={submitting || !email}
              >
                Send reset link
              </Button>
            </form>
          )}
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
