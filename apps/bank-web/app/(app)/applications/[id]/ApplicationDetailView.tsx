'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertBanner,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  KeyValueList,
  PageHeader,
  RadialProgress,
  Skeleton,
  Textarea,
} from '@forge/ui';
import { IconCheck, IconClose, IconExternal } from '@forge/ui/icons';
import {
  formatAbsoluteDate,
  formatCurrency,
  formatRelativeTime,
} from '@forge/ui/utils';
import {
  approveApplication,
  fetchApplicationDetail,
  rejectApplication,
  type ApproveLoanApplicationInput,
} from '../../../../lib/api/bankApi';
import { ApiError, toUserMessage } from '../../../../lib/api/errors';
import { useAuthStore } from '../../../../lib/auth/store';
import {
  DECISION_LABEL,
  DECISION_TONE,
  canDecideApplication,
  isCreditOfficer,
} from '../../../../lib/loanUtils';

export function ApplicationDetailView({
  applicationId,
}: {
  applicationId: string;
}) {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const canMutate = isCreditOfficer(role);
  const queryClient = useQueryClient();

  const detail = useQuery({
    queryKey: ['bank', 'applications', applicationId],
    queryFn: () => fetchApplicationDetail(applicationId),
    retry: false,
  });

  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [principalOverride, setPrincipalOverride] = useState('');
  const [aprOverride, setAprOverride] = useState('');
  const [termMonthsOverride, setTermMonthsOverride] = useState('');

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['bank', 'applications', applicationId] });
    void queryClient.invalidateQueries({ queryKey: ['bank', 'applications'] });
    void queryClient.invalidateQueries({ queryKey: ['bank', 'loans'] });
    void queryClient.invalidateQueries({ queryKey: ['bank', 'risk-radar'] });
  };

  const approveMutation = useMutation({
    mutationFn: (body: ApproveLoanApplicationInput) =>
      approveApplication(applicationId, body),
    onSuccess: (loan) => {
      invalidate();
      setShowApprove(false);
      // Send the officer straight to the new loan so they can immediately disburse.
      router.push(`/loans/${loan.id}`);
    },
    onError: (err) => setActionError(toUserMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectApplication(applicationId, { reason }),
    onSuccess: () => {
      invalidate();
      setActionError(null);
      setActionSuccess('Application rejected.');
      setShowReject(false);
      setRejectReason('');
    },
    onError: (err) => setActionError(toUserMessage(err)),
  });

  if (detail.isLoading) {
    return (
      <>
        <PageHeader
          title="Loading application…"
          breadcrumbs={[
            { label: 'Applications', href: '/applications' },
            { label: applicationId },
          ]}
        />
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  if (detail.isError) {
    const err = detail.error;
    const isNotFound = err instanceof ApiError && err.status === 404;
    return (
      <>
        <PageHeader
          title="Application"
          breadcrumbs={[
            { label: 'Applications', href: '/applications' },
            { label: applicationId },
          ]}
        />
        <div className="p-6">
          <AlertBanner
            tone="warning"
            title={isNotFound ? 'This application is no longer available' : 'Couldn’t load application'}
            description={
              isNotFound
                ? 'It may have been removed or you don’t have access.'
                : toUserMessage(err)
            }
            action={
              <Link href="/applications">
                <Button size="sm" variant="secondary">
                  Back to queue
                </Button>
              </Link>
            }
          />
        </div>
      </>
    );
  }

  const app = detail.data;
  if (!app) return null;
  const decidable = canDecideApplication(app.status);

  return (
    <>
      <PageHeader
        title={app.borrower.displayName}
        breadcrumbs={[
          { label: 'Applications', href: '/applications' },
          { label: app.id },
        ]}
        actions={
          canMutate && decidable ? (
            <>
              <Button
                variant="ghost"
                className="text-danger-600 hover:bg-danger-50"
                leadingIcon={<IconClose className="!h-4 !w-4" />}
                onClick={() => setShowReject(true)}
              >
                Reject
              </Button>
              <Button
                leadingIcon={<IconCheck className="!h-4 !w-4" />}
                onClick={() => setShowApprove(true)}
              >
                Approve
              </Button>
            </>
          ) : null
        }
      />

      {actionError ? (
        <div className="px-6 pt-4">
          <AlertBanner
            tone="danger"
            title="Action failed"
            description={actionError}
            onDismiss={() => setActionError(null)}
          />
        </div>
      ) : null}
      {actionSuccess ? (
        <div className="px-6 pt-4">
          <AlertBanner
            tone="success"
            title="Done"
            description={actionSuccess}
            onDismiss={() => setActionSuccess(null)}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    app.status === 'approved'
                      ? 'success'
                      : app.status === 'rejected'
                        ? 'danger'
                        : 'info'
                  }
                >
                  {app.status === 'approved'
                    ? 'Approved'
                    : app.status === 'rejected'
                      ? 'Rejected'
                      : 'Pending'}
                </Badge>
                <span className="font-mono text-xs text-neutral-500" data-numeric>
                  · {app.id}
                </span>
              </div>
              <span
                className="text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {formatCurrency(app.amountRequestedNaira)}
              </span>
            </CardHeader>
            <CardBody className="space-y-5">
              <div className="flex items-start gap-4">
                <Avatar
                  name={app.borrower.displayName}
                  src={app.borrower.photoUrl ?? undefined}
                  size="lg"
                />
                <div className="flex-1">
                  <p className="text-lg font-semibold text-neutral-900">
                    {app.borrower.displayName}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-2 text-xs text-neutral-500">
                    <Badge variant="soft">
                      {app.borrowerType === 'worker' ? 'Worker' : 'Business'}
                    </Badge>
                    Score {app.borrower.score} · {app.termMonths} month term
                  </p>
                  <Link
                    href={`/borrowers/${app.borrowerType}/${app.borrower.id}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:underline"
                  >
                    Open borrower profile
                    <IconExternal className="!h-3 !w-3" />
                  </Link>
                </div>
                <RadialProgress
                  value={app.borrower.score}
                  label={app.borrowerType === 'worker' ? 'Reliability' : 'Credit'}
                />
              </div>

              <KeyValueList
                layout="grid"
                items={[
                  {
                    label: 'Amount requested',
                    value: formatCurrency(app.amountRequestedNaira),
                  },
                  {
                    label: 'Term',
                    value: `${app.termMonths} months`,
                  },
                  {
                    label: 'Applied',
                    value: `${formatRelativeTime(app.appliedAt)} · ${formatAbsoluteDate(app.appliedAt)}`,
                  },
                  {
                    label: 'Decided',
                    value: app.decidedAt ? formatAbsoluteDate(app.decidedAt) : '—',
                  },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Model recommendation</CardTitle>
                <p className="mt-0.5 text-xs text-neutral-500">
                  All three signals together — the credit officer makes the final call.
                </p>
              </div>
              <Badge tone={DECISION_TONE[app.recommendedDecision]}>
                {DECISION_LABEL[app.recommendedDecision]}
              </Badge>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs text-neutral-500">Decision</p>
                  <p
                    className={`mt-1 text-lg font-semibold ${
                      app.recommendedDecision === 'approve'
                        ? 'text-success-700'
                        : app.recommendedDecision === 'approve_with_conditions'
                          ? 'text-warning-700'
                          : 'text-danger-700'
                    }`}
                  >
                    {DECISION_LABEL[app.recommendedDecision]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Confidence</p>
                  <p
                    className="mt-1 text-lg font-semibold tabular-nums text-neutral-900"
                    data-numeric
                  >
                    {app.recommendationConfidencePct}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Override</p>
                  <p className="mt-1 text-xs text-neutral-600">
                    {decidable
                      ? 'Use the buttons above to approve (with optional principal/APR/term overrides) or reject.'
                      : `Already ${app.status}.`}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-outline bg-surface-container-high p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Why
                </p>
                <p className="mt-1 text-sm text-neutral-700">{app.recommendationReason}</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Borrower</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar
                  name={app.borrower.displayName}
                  src={app.borrower.photoUrl ?? undefined}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {app.borrower.displayName}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    Score {app.borrower.score}
                  </p>
                </div>
              </div>
              <Link href={`/borrowers/${app.borrowerType}/${app.borrower.id}`}>
                <Button
                  variant="secondary"
                  className="w-full"
                  trailingIcon={<IconExternal className="!h-4 !w-4" />}
                >
                  Open full profile
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application</CardTitle>
            </CardHeader>
            <CardBody>
              <KeyValueList
                items={[
                  { label: 'Reference', value: app.id },
                  { label: 'Status', value: app.status },
                  { label: 'Applied', value: formatRelativeTime(app.appliedAt) },
                  {
                    label: 'Decided',
                    value: app.decidedAt ? formatAbsoluteDate(app.decidedAt) : '—',
                  },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </div>

      <Dialog open={showApprove} onOpenChange={setShowApprove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve application</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <p className="text-sm text-neutral-600">
              This creates a new loan in <strong>approved</strong> status. You can
              disburse it on the next page.
            </p>
            <FormField
              label="Principal override"
              hint={`Default: ${formatCurrency(app.amountRequestedNaira)}`}
            >
              <Input
                type="number"
                min={1000}
                step={1000}
                placeholder={String(app.amountRequestedNaira)}
                value={principalOverride}
                onChange={(e) => setPrincipalOverride(e.target.value)}
              />
            </FormField>
            <FormField label="APR override" hint="Decimal in [0, 1]. Default: 0.14">
              <Input
                type="number"
                step="0.01"
                min={0}
                max={1}
                placeholder="0.14"
                value={aprOverride}
                onChange={(e) => setAprOverride(e.target.value)}
              />
            </FormField>
            <FormField
              label="Term override (months)"
              hint={`Default: ${app.termMonths}`}
            >
              <Input
                type="number"
                min={1}
                max={60}
                step={1}
                placeholder={String(app.termMonths)}
                value={termMonthsOverride}
                onChange={(e) => setTermMonthsOverride(e.target.value)}
              />
            </FormField>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowApprove(false)}>
              Cancel
            </Button>
            <Button
              loading={approveMutation.isPending}
              onClick={() => {
                const body: ApproveLoanApplicationInput = {};
                if (principalOverride && Number(principalOverride) > 0)
                  body.principalNairaOverride = Number(principalOverride);
                if (aprOverride && Number(aprOverride) >= 0)
                  body.aprOverride = Number(aprOverride);
                if (termMonthsOverride && Number(termMonthsOverride) > 0)
                  body.termMonthsOverride = Number(termMonthsOverride);
                approveMutation.mutate(body);
              }}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <p className="text-sm text-neutral-600">
              The reason is logged and shared with the borrower in their next
              notification.
            </p>
            <FormField label="Reason" required>
              <Textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Credit score below threshold and recent missed repayments."
              />
            </FormField>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowReject(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={rejectMutation.isPending}
              disabled={!rejectReason.trim()}
              onClick={() => rejectMutation.mutate(rejectReason.trim())}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
