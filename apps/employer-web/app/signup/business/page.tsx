'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { components } from '@forge/types/api';
import { Button, Card, CardBody, CardHeader, CardTitle, FormField, Input, PageHeader, Select } from '@forge/ui';
import { useAuth } from '../../../lib/auth';
import { api, ApiError } from '../../../lib/api';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  businessName: z.string().min(2),
  businessType: z.enum(['wholesaler', 'factory', 'retailer', 'logistics']),
  businessPhone: z.string().optional(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  neighborhood: z.string().min(1),
  address: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export default function BusinessSignupPage() {
  const setSession = useAuth((s) => s.setSession);
  const fetchMe = useAuth((s) => s.fetchMe);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessType: 'logistics',
      // Map opens centered on the country (Lagos coords as a sensible default
      // for a Nigeria-focused product); the user picks the actual pin.
      lat: 6.4541,
      lng: 3.3947,
      neighborhood: '',
      address: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const body: components['schemas']['BusinessRegisterDto'] = {
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      phone: values.phone || undefined,
      businessName: values.businessName,
      businessType: values.businessType,
      businessPhone: values.businessPhone || undefined,
      registeredLocation: {
        lat: values.lat,
        lng: values.lng,
        neighborhood: values.neighborhood,
        address: values.address,
      },
    };
    try {
      const res = await api.post<components['schemas']['LoginResponseDto'], typeof body>(
        '/v1/dashboard/auth/business/register',
        body,
        { auth: false },
      );
      setSession({
        user: res.user,
        accessToken: res.accessToken,
        accessExpiresAt: res.accessExpiresAt,
      });
      await fetchMe();
      setDone(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('That email is already registered. Try signing in instead.');
        return;
      }
      setError(e instanceof Error ? e.message : 'Signup failed');
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Check your inbox</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm text-neutral-600">
            <p>We sent a verification link to your email. You can use the dashboard now; verify when you are ready.</p>
            <Link href="/" className="font-medium text-accent-600 hover:text-accent-700">
              Go to dashboard
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <PageHeader
        title="Create your business"
        description="One step creates your employer account and owner login."
      />
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Business signup</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Your full name" className="md:col-span-2">
              <Input {...register('fullName')} autoComplete="name" />
            </FormField>
            <FormField label="Work email" className="md:col-span-2">
              <Input type="email" {...register('email')} autoComplete="email" />
            </FormField>
            <FormField label="Password (10+ chars, letter + number)" className="md:col-span-2">
              <Input type="password" {...register('password')} autoComplete="new-password" />
            </FormField>
            <FormField label="Phone (optional)">
              <Input {...register('phone')} />
            </FormField>
            <FormField label="Business name" className="md:col-span-2">
              <Input {...register('businessName')} />
            </FormField>
            <FormField label="Business type">
              <Select
                options={[
                  { label: 'Wholesaler', value: 'wholesaler' },
                  { label: 'Factory', value: 'factory' },
                  { label: 'Retailer', value: 'retailer' },
                  { label: 'Logistics', value: 'logistics' },
                ]}
                {...register('businessType')}
              />
            </FormField>
            <FormField label="Business phone (optional)">
              <Input {...register('businessPhone')} />
            </FormField>
            <FormField label="Latitude">
              <Input type="number" step="any" {...register('lat')} />
            </FormField>
            <FormField label="Longitude">
              <Input type="number" step="any" {...register('lng')} />
            </FormField>
            <FormField label="Neighborhood" className="md:col-span-2">
              <Input {...register('neighborhood')} />
            </FormField>
            <FormField label="Registered address" className="md:col-span-2">
              <Input {...register('address')} />
            </FormField>
            {error ? <p className="text-sm text-danger-600 md:col-span-2">{error}</p> : null}
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create business'}
              </Button>
              <Link href="/login" className="text-sm font-medium text-accent-600 hover:text-accent-700">
                Already have an account?
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
