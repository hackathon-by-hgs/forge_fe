'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { AlertBanner, Button, Card, CardBody, CardHeader, CardTitle } from '@forge/ui';
import { IconBank } from '@forge/ui/icons';
import { verifyEmail } from '../../../../lib/api/auth';
import { ApiError } from '../../../../lib/api/errors';

type Status = 'idle' | 'loading' | 'ok' | 'err';

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

function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const ran = useRef(false);
  const [status, setStatus] = useState<Status>('idle');
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
        await verifyEmail({ token });
        setStatus('ok');
        router.replace('/login?verified=1');
      } catch (e) {
        setStatus('err');
        if (e instanceof ApiError && e.code === 'TOKEN_INVALID') {
          setMessage('This link is invalid or has expired.');
        } else if (e instanceof ApiError && e.code === 'TOKEN_EXPIRED') {
          setMessage('This link has expired. Request a new one.');
        } else {
          setMessage(e instanceof Error ? e.message : 'Verification failed');
        }
      }
    })();
  }, [router, token]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center space-y-2 px-6 py-10">
      <Brand />
      <Card>
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 text-sm text-ink-muted">
          {status === 'loading' ? <p>Verifying your email…</p> : null}
          {status === 'ok' ? <p>Redirecting to sign in…</p> : null}
          {status === 'err' && message ? (
            <>
              <AlertBanner tone="danger" title={message} />
              <Link href="/auth/forgot-password" className="block">
                <Button variant="secondary" className="w-full">
                  Request a new link
                </Button>
              </Link>
              <Link
                href="/login"
                className="block text-center text-xs font-medium text-accent-600 hover:text-accent-700"
              >
                Back to sign in
              </Link>
            </>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6 py-10 text-center text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
