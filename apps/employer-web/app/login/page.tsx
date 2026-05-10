'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader, CardTitle, Input } from '@forge/ui';
import { useAuth } from '../../lib/auth';
import { ApiError } from '../../lib/api';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
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
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError) {
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

          <div className="mt-4 rounded-md border border-outline-variant bg-surface-container px-3 py-2">
            <p className="text-xs text-ink-muted">
              New accounts aren’t self-service yet. If you need access, request an invite from the platform
              admin.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

