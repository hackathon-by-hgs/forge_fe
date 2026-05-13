'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader, CardTitle, FormField, Input } from '@forge/ui';
import { api } from '../../../lib/api';

const schema = z.object({ email: z.string().email() });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post<undefined, { email: string }>(
        '/v1/dashboard/auth/email/forgot',
        { email: values.email },
        { auth: false },
      );
    } catch {
      // Endpoint is always-204 by design; never leak account existence.
      // Swallow errors so the user always sees the same message.
    }
    setDone(true);
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
        </CardHeader>
        <CardBody>
          {done ? (
            <p className="text-sm text-neutral-600">
              If that email exists in Forge, we sent a reset link. Check your inbox (and spam).
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField label="Email">
                <Input type="email" autoComplete="email" {...register('email')} />
              </FormField>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          )}
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
