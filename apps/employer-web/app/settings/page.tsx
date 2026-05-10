'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  PageHeader,
  Select,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@forge/ui';
import { IconAdd } from '@forge/ui/icons';
import { EmployerTypeSchema, type EmployerType } from '@forge/types';
import { useAuth } from '../../lib/auth';
import { fetchBusinessSettings, fetchTeamSettings } from '../../lib/settings';

export default function SettingsPage() {
  const router = useRouter();
  const role = useAuth((s) => s.user?.role);

  useEffect(() => {
    if (role === 'business_hiring_manager') router.replace('/');
  }, [role, router]);

  const businessQuery = useQuery({
    queryKey: ['settings', 'business'],
    queryFn: fetchBusinessSettings,
    enabled: role !== 'business_hiring_manager',
  });

  const teamQuery = useQuery({
    queryKey: ['settings', 'team'],
    queryFn: fetchTeamSettings,
    enabled: role !== 'business_hiring_manager',
  });

  if (role === 'business_hiring_manager') {
    return null;
  }

  const business = businessQuery.data;
  const businessName = business?.businessName ?? business?.name ?? '';
  const businessTypeRaw = (business?.type as string | undefined) ?? 'wholesaler';
  const businessTypeParsed = EmployerTypeSchema.safeParse(businessTypeRaw);
  const businessType: EmployerType = businessTypeParsed.success ? businessTypeParsed.data : 'wholesaler';
  const contactEmail = business?.primaryContactEmail ?? business?.email ?? '';
  const contactPhone = business?.primaryContactPhone ?? business?.phone ?? '';
  const address = business?.registeredAddress ?? business?.address ?? '';

  return (
    <>
      <PageHeader title="Settings" description="Business profile, team, billing, and integrations." />

      <div className="p-6">
        {businessQuery.isError ? (
          <div className="mb-4 rounded-lg border border-outline bg-surface p-4">
            <p className="text-sm font-semibold text-neutral-900">Couldn’t load business settings</p>
            <p className="mt-1 text-xs text-neutral-600">
              {businessQuery.error instanceof Error ? businessQuery.error.message : 'Unknown error'}
            </p>
            <Button className="mt-3" variant="secondary" onClick={() => void businessQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        {teamQuery.isError ? (
          <div className="mb-4 rounded-lg border border-outline bg-surface p-4">
            <p className="text-sm font-semibold text-neutral-900">Couldn’t load team</p>
            <p className="mt-1 text-xs text-neutral-600">
              {teamQuery.error instanceof Error ? teamQuery.error.message : 'Unknown error'}
            </p>
            <Button className="mt-3" variant="secondary" onClick={() => void teamQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Business profile</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="squad">Squad account</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Business profile</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                {businessQuery.isLoading ? (
                  <p className="text-sm text-neutral-600">Loading…</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="Business name">
                      <Input defaultValue={businessName} readOnly />
                    </FormField>
                    <FormField label="Business type">
                      <Select
                        options={[
                          { label: 'Wholesaler', value: 'wholesaler' },
                          { label: 'Factory', value: 'factory' },
                          { label: 'Retailer', value: 'retailer' },
                          { label: 'Logistics', value: 'logistics' },
                        ]}
                        defaultValue={businessType}
                      />
                    </FormField>
                    <FormField label="Primary contact email">
                      <Input type="email" defaultValue={contactEmail} readOnly />
                    </FormField>
                    <FormField label="Primary contact phone">
                      <Input defaultValue={contactPhone} readOnly />
                    </FormField>
                    <FormField label="Registered address" className="md:col-span-2">
                      <Input defaultValue={address} readOnly />
                    </FormField>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" disabled>
                    Cancel
                  </Button>
                  <Button disabled>
                    Save changes
                  </Button>
                </div>
                <p className="text-xs text-neutral-500">
                  Editing is wired next: mutations will call <span className="font-mono">PATCH /v1/settings/business</span>{' '}
                  with validation + idempotency where required.
                </p>
              </CardBody>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Team members</CardTitle>
                <Button leadingIcon={<IconAdd className="!h-4 !w-4" />} size="sm" disabled>
                  Invite
                </Button>
              </CardHeader>
              <CardBody>
                {teamQuery.isLoading ? (
                  <p className="text-sm text-neutral-600">Loading…</p>
                ) : (teamQuery.data?.length ?? 0) === 0 ? (
                  <p className="text-sm text-neutral-600">No team members yet.</p>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {teamQuery.data?.map((m) => {
                      const name = m.fullName ?? m.name ?? m.email ?? 'Team member';
                      return (
                        <li
                          key={m.id ?? m.userId ?? m.email ?? name}
                          className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar name={name} />
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{name}</p>
                              <p className="text-xs text-neutral-500">{m.email ?? '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge>{String(m.role)}</Badge>
                            <Button variant="ghost" size="sm" disabled>
                              Manage
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardBody>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <p className="text-sm text-neutral-600">
                  Notification preferences will load from{' '}
                  <span className="font-mono">GET /v1/settings/notifications</span> once enabled on your backend.
                </p>
                {[
                  {
                    label: 'Application received',
                    desc: 'Email me when a worker applies to a job.',
                    on: true,
                  },
                  {
                    label: 'Worker clocked in',
                    desc: 'Push notification on the mobile app.',
                    on: true,
                  },
                  {
                    label: 'Payment processed',
                    desc: 'Email a receipt for every Squad payout.',
                    on: false,
                  },
                  {
                    label: 'Weekly business summary',
                    desc: 'Sunday digest with KPIs and credit health.',
                    on: true,
                  },
                ].map((n) => (
                  <div
                    key={n.label}
                    className="flex items-center justify-between rounded-lg border border-outline p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{n.label}</p>
                      <p className="text-xs text-neutral-500">{n.desc}</p>
                    </div>
                    <Switch defaultChecked={n.on} disabled />
                  </div>
                ))}
              </CardBody>
            </Card>
          </TabsContent>

          <TabsContent value="squad" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Squad settlement account</CardTitle>
                <Badge tone="success">Connected</Badge>
              </CardHeader>
              <CardBody className="space-y-4">
                <p className="text-sm text-neutral-600">
                  Squad wallet status will load from <span className="font-mono">GET /v1/settings/squad</span>.
                </p>
              </CardBody>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Plan & invoicing</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <p className="text-sm text-neutral-600">
                  Billing will load from <span className="font-mono">GET /v1/settings/billing</span>.
                </p>
              </CardBody>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
