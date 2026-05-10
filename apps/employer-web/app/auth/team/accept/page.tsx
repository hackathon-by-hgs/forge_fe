'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader, CardTitle, FormField, Input } from '@forge/ui';
import type { components } from '@forge/types/api';
import { useAuth } from '../../../../lib/auth';
import { api, ApiError } from '../../../../lib/api';

const schema = z.object({
  fullName: z.string().min(2),
  password: z.string().min(10),
});
type FormValues = z.infer<typeof schema>;

function TeamAcceptForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const setSession = useAuth((s) => s.setSession);
  const fetchMe = useAuth((s) => s.fetchMe);
  const [inviteErr, setInviteErr] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setInviteErr(null);
    if (!token) {
      setInviteErr('Missing invitation token.');
      return;
    }
    try {
      const body: components['schemas']['AcceptInvitationDto'] = {
        token,
        fullName: values.fullName,
        password: values.password,
      };
      const res = await api.post<components['schemas']['LoginResponseDto'], typeof body>(
        '/v1/dashboard/auth/team/accept',
        body,
        { auth: false },
      );
      setSession({
        user: res.user,
        accessToken: res.accessToken,
        accessExpiresAt: res.accessExpiresAt,
      });
      await fetchMe();
      router.replace('/');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'INVITATION_INVALID') {
        setInviteErr('This invitation has expired or already been used.');
        return;
      }
      setInviteErr(e instanceof Error ? e.message : 'Could not accept invite');
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Accept team invitation</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Full name">
              <Input {...register('fullName')} autoComplete="name" />
            </FormField>
            <FormField label="Choose password">
              <Input type="password" {...register('password')} autoComplete="new-password" />
            </FormField>
            {inviteErr ? <p className="text-sm text-danger-600">{inviteErr}</p> : null}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Joining…' : 'Join team'}
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

export default function TeamAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-6 py-16">
          <p className="text-sm text-ink-muted">Loading…</p>
        </div>
      }
    >
      <TeamAcceptForm />
    </Suspense>
  );
}
