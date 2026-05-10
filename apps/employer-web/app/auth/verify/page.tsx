'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@forge/ui';
import { api, ApiError } from '../../../lib/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const ran = useRef(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('err');
      setMessage('Missing verification token.');
      return;
    }
    if (ran.current) return;
    ran.current = true;
    setStatus('loading');
    void (async () => {
      try {
        await api.post<undefined, { token: string }>(
          '/v1/dashboard/auth/email/verify',
          { token },
          { auth: false },
        );
        setStatus('ok');
        router.replace('/login?verified=1');
      } catch (e) {
        setStatus('err');
        if (e instanceof ApiError && e.code === 'TOKEN_INVALID') {
          setMessage('This link is invalid or has expired.');
        } else {
          setMessage(e instanceof Error ? e.message : 'Verification failed');
        }
      }
    })();
  }, [router, token]);

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 text-sm text-neutral-600">
          {status === 'loading' ? <p>Verifying your email…</p> : null}
          {status === 'ok' ? <p>Redirecting to sign in…</p> : null}
          {status === 'err' ? (
            <>
              <p className="text-danger-600">{message}</p>
              <Link
                href="/auth/forgot-password"
                className="inline-flex h-9 items-center justify-center rounded-md border border-outline bg-surface px-3 text-sm font-medium text-neutral-900 hover:bg-surface-container-high"
              >
                Request a new link
              </Link>
            </>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
