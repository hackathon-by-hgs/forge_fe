'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader, CardTitle, Input } from '@forge/ui';
import { useAuth } from '../../lib/auth';
import { ApiError } from '../../lib/api';
import { safeAuthReturnPath } from '../../lib/publicRoutes';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified') === '1';
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await login(values);
      const next = safeAuthReturnPath(searchParams.get('next'));
      router.replace(next ?? '/');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_CREDENTIALS') {
          setError('Invalid email or password.');
          return;
        }
        setError(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center px-6 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <p className="text-xs text-ink-muted">
            Use a demo login from the handoff doc (password: <span className="font-mono">forge-demo-pass</span>).
          </p>
        </CardHeader>
        <CardBody>
          {verified ? (
            <p className="mb-3 rounded-md border border-outline-variant bg-surface-container px-3 py-2 text-xs text-ink">
              Email verified. You can sign in now.
            </p>
          ) : null}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink" htmlFor="email">
                Email
              </label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
            </div>

            {error ? <p className="text-xs font-medium text-danger-600">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-4 flex flex-col gap-2 text-center text-sm">
            <Link href="/auth/forgot-password" className="font-medium text-accent-600 hover:text-accent-700">
              Forgot password?
            </Link>
            <Link href="/signup/business" className="font-medium text-accent-600 hover:text-accent-700">
              Create a business account
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center px-6 py-10">
          <p className="text-sm text-ink-muted">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
