'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import type { components } from '@forge/types/api';
import { NubanFundingBlock } from '../../components/NubanFundingBlock';
import { useAuth } from '../../lib/auth';
import {
  canChangeTeamRoles,
  canInviteTeam,
  canPatchBusinessSquadBilling,
  isHiringManager,
} from '../../lib/roles';
import { ApiError } from '../../lib/api';
import {
  disconnectSquad,
  getBilling,
  getBusinessProfile,
  getNotificationPrefs,
  getSquadStatus,
  getTeam,
  inviteTeamMember,
  patchBilling,
  patchBusinessProfile,
  patchNotificationPrefs,
  removeTeamMember,
  revokeInvitation,
  updateTeamMemberRole,
  type BillingDto,
  type BusinessProfileDto,
  type InviteTeamMemberDto,
  type NotificationPrefsDto,
  type SquadStatusDto,
  type TeamListDto,
  type UpdateBillingDto,
  type UpdateBusinessProfileDto,
  type UpdateNotificationPrefsDto,
  type UpdateTeamMemberRoleDto,
} from '../../lib/settingsApi';

type TeamMemberDto = components['schemas']['TeamMemberDto'];
type PendingInvitationDto = components['schemas']['PendingInvitationDto'];

function walletIdLabel(walletId: SquadStatusDto['walletId']): string {
  if (walletId == null) return '—';
  if (typeof walletId === 'string') return walletId;
  return '—';
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const role = user?.role;
  const canBiz = canPatchBusinessSquadBilling(role);
  const canInvite = canInviteTeam(role);
  const canRole = canChangeTeamRoles(role);
  const hiringOnly = isHiringManager(role);

  const defaultTab = hiringOnly ? 'team' : 'profile';

  const businessQuery = useQuery({
    queryKey: ['settings', 'business'],
    queryFn: getBusinessProfile,
    enabled: !hiringOnly,
  });

  const teamQuery = useQuery({
    queryKey: ['settings', 'team'],
    queryFn: getTeam,
  });

  const notifPrefsQuery = useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: getNotificationPrefs,
  });

  const squadQuery = useQuery({
    queryKey: ['settings', 'squad'],
    queryFn: getSquadStatus,
    enabled: !hiringOnly,
  });

  const billingQuery = useQuery({
    queryKey: ['settings', 'billing'],
    queryFn: getBilling,
    enabled: !hiringOnly,
  });

  const [bizDraft, setBizDraft] = useState<UpdateBusinessProfileDto | null>(null);
  const business = businessQuery.data;

  const saveBusiness = useMutation({
    mutationFn: (body: UpdateBusinessProfileDto) => patchBusinessProfile(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', 'business'] });
      setBizDraft(null);
    },
  });

  const invite = useMutation({
    mutationFn: (body: InviteTeamMemberDto) =>
      inviteTeamMember(body, typeof crypto !== 'undefined' ? crypto.randomUUID() : `${Date.now()}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', 'team'] });
    },
  });

  const patchRole = useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: UpdateTeamMemberRoleDto }) =>
      updateTeamMemberRole(userId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', 'team'] });
    },
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => removeTeamMember(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', 'team'] });
    },
  });

  const revoke = useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', 'team'] });
    },
  });

  const patchNotif = useMutation({
    mutationFn: (body: UpdateNotificationPrefsDto) => patchNotificationPrefs(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] });
    },
  });

  const disconnect = useMutation({
    mutationFn: () => disconnectSquad(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', 'squad'] });
    },
  });

  const saveBilling = useMutation({
    mutationFn: (body: UpdateBillingDto) => patchBilling(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', 'billing'] });
    },
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<InviteTeamMemberDto['role']>('business_hiring_manager');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [billingPlan, setBillingPlan] = useState<BillingDto['plan'] | ''>('');
  const [billingEmail, setBillingEmail] = useState('');

  const billing = billingQuery.data;
  useEffect(() => {
    if (!billing) return;
    setBillingPlan(billing.plan);
    setBillingEmail(typeof billing.invoicingEmail === 'string' ? billing.invoicingEmail : '');
  }, [billing]);

  const billingDirty = !!billing && (
    (billingPlan && billingPlan !== billing.plan) ||
    billingEmail !== (typeof billing.invoicingEmail === 'string' ? billing.invoicingEmail : '')
  );

  const onInvite = async () => {
    setInviteError(null);
    try {
      await invite.mutateAsync({ email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail('');
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === 'ALREADY_TEAM_MEMBER') {
          setInviteError(`${inviteEmail.trim()} is already on your team.`);
        } else {
          setInviteError(e.message);
        }
      } else {
        setInviteError('Invite failed');
      }
    }
  };

  const draft: UpdateBusinessProfileDto = bizDraft ?? {
    businessName: business?.businessName,
    type: business?.type,
    phoneNumber: undefined,
    registeredLocation: business?.registeredLocation,
  };

  return (
    <>
      <PageHeader title="Settings" description="Business profile, team, billing, and integrations." />

      <div className="p-6">
        <Tabs defaultValue={defaultTab}>
          <TabsList className="flex flex-wrap gap-1">
            {!hiringOnly ? <TabsTrigger value="profile">Business profile</TabsTrigger> : null}
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            {!hiringOnly ? <TabsTrigger value="squad">Squad account</TabsTrigger> : null}
            {!hiringOnly ? <TabsTrigger value="billing">Billing</TabsTrigger> : null}
          </TabsList>

          {!hiringOnly ? (
            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business profile</CardTitle>
                </CardHeader>
                <CardBody className="space-y-4">
                  {businessQuery.isLoading ? <p className="text-sm text-neutral-600">Loading…</p> : null}
                  {businessQuery.isError ? (
                    <p className="text-sm text-danger-600">
                      {businessQuery.error instanceof Error ? businessQuery.error.message : 'Error'}
                    </p>
                  ) : null}
                  {business ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label="Business name">
                        <Input
                          disabled={!canBiz}
                          value={draft.businessName ?? ''}
                          onChange={(e) =>
                            setBizDraft({ ...draft, businessName: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="Business type">
                        <Select
                          disabled={!canBiz}
                          options={[
                            { label: 'Wholesaler', value: 'wholesaler' },
                            { label: 'Factory', value: 'factory' },
                            { label: 'Retailer', value: 'retailer' },
                            { label: 'Logistics', value: 'logistics' },
                          ]}
                          value={draft.type ?? business.type}
                          onChange={(e) =>
                            setBizDraft({
                              ...draft,
                              type: e.target.value as BusinessProfileDto['type'],
                            })
                          }
                        />
                      </FormField>
                      <FormField label="Latitude" className="md:col-span-2">
                        <Input
                          disabled={!canBiz}
                          type="number"
                          value={draft.registeredLocation?.lat ?? business.registeredLocation.lat}
                          onChange={(e) =>
                            setBizDraft({
                              ...draft,
                              registeredLocation: {
                                ...(draft.registeredLocation ?? business.registeredLocation),
                                lat: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </FormField>
                      <FormField label="Longitude">
                        <Input
                          disabled={!canBiz}
                          type="number"
                          value={draft.registeredLocation?.lng ?? business.registeredLocation.lng}
                          onChange={(e) =>
                            setBizDraft({
                              ...draft,
                              registeredLocation: {
                                ...(draft.registeredLocation ?? business.registeredLocation),
                                lng: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </FormField>
                      <FormField label="Neighborhood">
                        <Input
                          disabled={!canBiz}
                          value={
                            draft.registeredLocation?.neighborhood ??
                            business.registeredLocation.neighborhood
                          }
                          onChange={(e) =>
                            setBizDraft({
                              ...draft,
                              registeredLocation: {
                                ...(draft.registeredLocation ?? business.registeredLocation),
                                neighborhood: e.target.value,
                              },
                            })
                          }
                        />
                      </FormField>
                      <FormField label="Address" className="md:col-span-2">
                        <Input
                          disabled={!canBiz}
                          value={
                            draft.registeredLocation?.address ?? business.registeredLocation.address
                          }
                          onChange={(e) =>
                            setBizDraft({
                              ...draft,
                              registeredLocation: {
                                ...(draft.registeredLocation ?? business.registeredLocation),
                                address: e.target.value,
                              },
                            })
                          }
                        />
                      </FormField>
                    </div>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      disabled={!canBiz || !bizDraft}
                      onClick={() => setBizDraft(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!canBiz || saveBusiness.isPending || !bizDraft}
                      onClick={() => bizDraft && void saveBusiness.mutateAsync(bizDraft)}
                    >
                      Save changes
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </TabsContent>
          ) : null}

          <TabsContent value="team" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Team members</CardTitle>
              </CardHeader>
              <CardBody className="space-y-6">
                {canInvite ? (
                  <form
                    className="flex flex-col gap-3 rounded-lg border border-outline p-3 sm:flex-row sm:items-end"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void onInvite();
                    }}
                  >
                    <FormField label="Email" className="min-w-0 flex-1">
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="teammate@company.ng"
                        required
                      />
                    </FormField>
                    <FormField label="Role">
                      <Select
                        options={[
                          { label: 'Admin', value: 'business_admin' },
                          { label: 'Hiring manager', value: 'business_hiring_manager' },
                        ]}
                        value={inviteRole}
                        onChange={(e) =>
                          setInviteRole(e.target.value as InviteTeamMemberDto['role'])
                        }
                      />
                    </FormField>
                    <Button type="submit" leadingIcon={<IconAdd className="!h-4 !w-4" />} disabled={invite.isPending}>
                      Invite
                    </Button>
                  </form>
                ) : null}
                {inviteError ? <p className="text-xs text-danger-600">{inviteError}</p> : null}

                {teamQuery.isLoading ? <p className="text-sm text-neutral-600">Loading…</p> : null}
                {teamQuery.data ? (
                  <TeamTables
                    team={teamQuery.data}
                    currentUserId={user?.id}
                    canRole={canRole}
                    onPatchRole={(userId, body) => void patchRole.mutateAsync({ userId, body })}
                    onRemove={(userId) => void removeMember.mutateAsync(userId)}
                    onRevoke={(id) => void revoke.mutateAsync(id)}
                  />
                ) : null}
              </CardBody>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification channels</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                {notifPrefsQuery.isLoading ? <p className="text-sm text-neutral-600">Loading…</p> : null}
                {notifPrefsQuery.data ? (
                  <NotificationSwitches
                    prefs={notifPrefsQuery.data}
                    disabled={!canBiz}
                    onChange={(patch) => void patchNotif.mutateAsync(patch)}
                  />
                ) : null}
                {hiringOnly ? (
                  <p className="text-xs text-neutral-500">
                    Channel preferences are controlled by owners and admins.
                  </p>
                ) : null}
              </CardBody>
            </Card>
          </TabsContent>

          {!hiringOnly ? (
            <TabsContent value="squad" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Squad settlement account</CardTitle>
                  {squadQuery.data?.connected ? (
                    <Badge tone="success">Connected</Badge>
                  ) : (
                    <Badge tone="neutral">Not connected</Badge>
                  )}
                </CardHeader>
                <CardBody className="space-y-4">
                  {squadQuery.isLoading ? <p className="text-sm text-neutral-600">Loading…</p> : null}
                  {squadQuery.data ? (
                    <>
                      <p className="text-sm text-neutral-600">
                        Wallet balance:{' '}
                        <span className="font-medium tabular-nums">
                          {squadQuery.data.walletBalanceNaira.toLocaleString('en-NG', {
                            style: 'currency',
                            currency: 'NGN',
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </p>
                      <p className="text-xs text-neutral-500">
                        Wallet ID: <span className="font-mono">{walletIdLabel(squadQuery.data.walletId)}</span>
                      </p>
                      <p className="text-xs text-neutral-500">
                        Payouts paused: {squadQuery.data.payoutsPaused ? 'Yes' : 'No'}
                      </p>
                      <NubanFundingBlock virtualAccount={squadQuery.data.virtualAccount} />
                      <Button
                        variant="secondary"
                        disabled={!canBiz || disconnect.isPending}
                        onClick={() => void disconnect.mutateAsync()}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : null}
                </CardBody>
              </Card>
            </TabsContent>
          ) : null}

          {!hiringOnly ? (
            <TabsContent value="billing" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Plan & invoicing</CardTitle>
                </CardHeader>
                <CardBody className="space-y-4">
                  {billingQuery.isLoading ? <p className="text-sm text-neutral-600">Loading…</p> : null}
                  {billing ? (
                    <>
                      <FormField label="Plan">
                        <Select
                          disabled={!canBiz}
                          options={[
                            { label: 'Starter', value: 'starter' },
                            { label: 'Growth', value: 'growth' },
                            { label: 'Scale', value: 'scale' },
                          ]}
                          value={(billingPlan || billing.plan) as string}
                          onChange={(e) => setBillingPlan(e.target.value as BillingDto['plan'])}
                        />
                      </FormField>
                      <FormField label="Invoicing email">
                        <Input
                          disabled={!canBiz}
                          type="email"
                          value={billingEmail}
                          onChange={(e) => setBillingEmail(e.target.value)}
                        />
                      </FormField>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          disabled={!canBiz || saveBilling.isPending || !billingDirty}
                          onClick={() => {
                            setBillingPlan(billing.plan);
                            setBillingEmail(
                              typeof billing.invoicingEmail === 'string'
                                ? billing.invoicingEmail
                                : '',
                            );
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={!canBiz || saveBilling.isPending || !billingDirty}
                          onClick={() =>
                            void saveBilling.mutateAsync({
                              plan: billingPlan || undefined,
                              invoicingEmail: billingEmail || undefined,
                            })
                          }
                        >
                          Save billing
                        </Button>
                      </div>
                    </>
                  ) : null}
                </CardBody>
              </Card>
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </>
  );
}

function NotificationSwitches(props: {
  prefs: NotificationPrefsDto;
  disabled: boolean;
  onChange: (patch: UpdateNotificationPrefsDto) => void;
}) {
  const { prefs, disabled, onChange } = props;
  return (
    <>
      {(
        [
          ['newApplication', 'New applications', prefs.newApplication],
          ['clockEvents', 'Clock-in / clock-out', prefs.clockEvents],
          ['paymentEvents', 'Payment events', prefs.paymentEvents],
        ] as const
      ).map(([key, label, on]) => (
        <div
          key={key}
          className="flex items-center justify-between rounded-lg border border-outline p-3"
        >
          <div>
            <p className="text-sm font-medium text-neutral-900">{label}</p>
          </div>
          <Switch
            disabled={disabled}
            checked={on}
            onCheckedChange={(next) => onChange({ [key]: next })}
          />
        </div>
      ))}
    </>
  );
}

function TeamTables(props: {
  team: TeamListDto;
  currentUserId?: string;
  canRole: boolean;
  onPatchRole: (userId: string, body: UpdateTeamMemberRoleDto) => void;
  onRemove: (userId: string) => void;
  onRevoke: (id: string) => void;
}) {
  const { team, currentUserId, canRole, onPatchRole, onRemove, onRevoke } = props;

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Members</p>
        <ul className="divide-y divide-neutral-100 rounded-lg border border-outline">
          {team.members.map((m: TeamMemberDto) => {
            const isOwner = m.role === 'business_owner';
            const isSelf = m.id === currentUserId;
            return (
              <li
                key={m.id}
                className="flex flex-col gap-3 py-3 px-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={m.fullName} />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{m.fullName}</p>
                    <p className="text-xs text-neutral-500">{m.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{m.role}</Badge>
                  {canRole && !isOwner && !isSelf ? (
                    <>
                      <Select
                        className="w-44"
                        options={[
                          { label: 'Admin', value: 'business_admin' },
                          { label: 'Hiring manager', value: 'business_hiring_manager' },
                        ]}
                        value={m.role}
                        onChange={(e) =>
                          onPatchRole(m.id, {
                            role: e.target.value as UpdateTeamMemberRoleDto['role'],
                          })
                        }
                      />
                      <Button variant="ghost" size="sm" onClick={() => onRemove(m.id)}>
                        Remove
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Pending invitations
        </p>
        {team.pending.length === 0 ? (
          <p className="text-sm text-neutral-600">No pending invites.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 rounded-lg border border-outline">
            {team.pending.map((p: PendingInvitationDto) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 py-3 px-3 text-sm"
              >
                <div>
                  <p className="font-medium text-neutral-900">{p.email}</p>
                  <p className="text-xs text-neutral-500">
                    {p.role} · from {p.invitedByName}
                  </p>
                </div>
                {canRole ? (
                  <Button variant="ghost" size="sm" onClick={() => onRevoke(p.id)}>
                    Revoke
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
