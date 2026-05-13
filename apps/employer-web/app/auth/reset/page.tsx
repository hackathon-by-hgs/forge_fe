'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader, CardTitle, FormField, Input } from '@forge/ui';
import { api, ApiError } from '../../../lib/api';

const schema = z
  .object({
    password: z.string().min(10),
    confirm: z.string().min(10),
  })
  .refine((d) => d.password === d.confirm, { message: 'Passwords must match', path: ['confirm'] });

type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      setError('root', { message: 'Missing reset token.' });
      return;
    }
    try {
      await api.post<undefined, { token: string; newPassword: string }>(
        '/v1/dashboard/auth/email/reset',
        { token, newPassword: values.password },
        { auth: false },
      );
      router.replace('/login');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Reset failed';
      setError('root', { message: msg });
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="New password" error={errors.password?.message}>
              <Input type="password" autoComplete="new-password" {...register('password')} />
            </FormField>
            <FormField label="Confirm password" error={errors.confirm?.message}>
              <Input type="password" autoComplete="new-password" {...register('confirm')} />
            </FormField>
            {errors.root ? (
              <p className="text-sm text-danger-600">{errors.root.message}</p>
            ) : null}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Saving…' : 'Update password'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link href="/login" className="font-medium text-accent-600 hover:text-accent-700">
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
        <div className="mx-auto max-w-md px-6 py-16">
          <p className="text-sm text-ink-muted">Loading…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
