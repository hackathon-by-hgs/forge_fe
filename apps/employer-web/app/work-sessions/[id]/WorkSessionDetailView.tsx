'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  KeyValueList,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
} from '@forge/ui';
import {
  IconAlert,
  IconCamera,
  IconCheck,
  IconClock,
  IconLocation,
  IconShield,
  IconStar,
} from '@forge/ui/icons';
import {
  formatAbsoluteDate,
  formatCurrency,
  formatRelativeTime,
} from '@forge/ui/utils';
import { ApiError } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { toastApiError, toastInfo, toastSuccess } from '../../../lib/toast';
import { getPendingRatings, type PendingRatingItem } from '../../../lib/ratingsApi';
import { RatingDialog } from '../../../components/RatingDialog';
import {
  canActOnSession,
  confirmWorkSession,
  disputeWorkSession,
  DISPUTE_REASONS,
  getWorkSession,
  isCronTicking,
  isSettled,
  VERIFICATION_STATE_LABEL,
  type DisputeReason,
  type WorkSessionDto,
} from '../../../lib/workSessionsApi';

export function WorkSessionDetailView({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();
  const employerId = useAuth(
    (s) => (s.user?.employerId as string | null | undefined) ?? null,
  );

  const detailKey = ['employer', 'review-queue', 'detail', sessionId] as const;
  const detailQuery = useQuery({
    queryKey: detailKey,
    queryFn: () => getWorkSession(sessionId),
    retry: false,
  });

  const session = detailQuery.data;
  const [optimisticInFlight, setOptimisticInFlight] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  // The "Rate this worker" CTA only renders when this session shows up in
  // the pending-ratings inbox — that's the canonical "unrated" signal per
  // brief. Fetched lazily once the session has settled, so we don't hit
  // the endpoint for every in-progress session view.
  const pendingRatingsQuery = useQuery({
    queryKey: ['employer', 'pending-ratings'],
    queryFn: getPendingRatings,
    enabled: Boolean(session && isSettled(session)),
    retry: false,
  });
  const isUnrated = Boolean(
    session &&
      pendingRatingsQuery.data?.items.some((it) => it.sessionId === session.id),
  );
  const pendingRatingForThisSession: PendingRatingItem | null =
    pendingRatingsQuery.data?.items.find((it) => it.sessionId === session?.id) ??
    null;

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['employer', 'review-queue'] });
    void queryClient.invalidateQueries({ queryKey: ['employer', 'overview'] });
    void queryClient.invalidateQueries({ queryKey: ['employer', 'transactions'] });
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const confirmMutation = useMutation({
    mutationFn: () => {
      if (!employerId) {
        return Promise.reject(
          new ApiError({
            status: 400,
            code: 'EMPLOYER_REQUIRED',
            message: 'No employer context — please reload.',
          }),
        );
      }
      return confirmWorkSession(sessionId, employerId);
    },
    onMutate: () => {
      setActionError(null);
      setOptimisticInFlight(true);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(detailKey, updated);
      invalidateAll();
      toastSuccess('Payment released', {
        description: `${updated.worker.fullName}’s payout is on the way.`,
      });
    },
    onError: (err) => {
      setOptimisticInFlight(false);
      handleActionError(err, {
        onStaleState: () => {
          void detailQuery.refetch();
          setActionError(
            'This session was already resolved. The page has been refreshed.',
          );
          toastApiError(err, 'Already resolved');
        },
        onNotFound: () => {
          setActionError('This session no longer exists.');
          toastApiError(err, 'Session no longer exists');
        },
        onProviderDown: () => {
          setActionError(
            'Squad is temporarily unavailable. Tap Confirm again to retry — your action is idempotent.',
          );
          toastApiError(err, 'Squad is temporarily unavailable');
        },
        onGeneric: (message) => {
          setActionError(message);
          toastApiError(err, 'Couldn’t release payment');
        },
      });
    },
    onSettled: () => {
      setShowConfirmDialog(false);
    },
  });

  const disputeMutation = useMutation({
    mutationFn: (input: { reason: DisputeReason; description?: string }) => {
      if (!employerId) {
        return Promise.reject(
          new ApiError({
            status: 400,
            code: 'EMPLOYER_REQUIRED',
            message: 'No employer context — please reload.',
          }),
        );
      }
      return disputeWorkSession(sessionId, employerId, {
        reason: input.reason,
        description: input.description,
      });
    },
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: (resp) => {
      queryClient.setQueryData(detailKey, resp.session);
      invalidateAll();
      toastInfo('Dispute opened', {
        description: 'Funds remain in your wallet pending ops review.',
      });
      setShowDisputeDialog(false);
    },
    onError: (err) => {
      handleActionError(err, {
        onStaleState: () => {
          void detailQuery.refetch();
          setActionError(
            'This session was already resolved. The page has been refreshed.',
          );
          toastApiError(err, 'Already resolved');
        },
        onNotFound: () => {
          setActionError('This session no longer exists.');
          toastApiError(err, 'Session no longer exists');
        },
        onGeneric: (message) => {
          setActionError(message);
          toastApiError(err, 'Couldn’t open the dispute');
        },
      });
    },
  });

  if (detailQuery.isLoading) {
    return (
      <>
        <PageHeader
          title="Loading session…"
          breadcrumbs={[
            { label: 'Review queue', href: '/work-sessions' },
            { label: sessionId },
          ]}
        />
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Proof photo card (16/9 aspect) + header pill + amount */}
            <Skeleton className="aspect-[16/9] w-full rounded-xl" />
            {/* Clock events card */}
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            {/* Worker card */}
            <Skeleton className="h-36 w-full rounded-xl" />
            {/* Job card */}
            <Skeleton className="h-36 w-full rounded-xl" />
            {/* Hold window card */}
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  if (detailQuery.isError) {
    const err = detailQuery.error;
    const isNotFound = err instanceof ApiError && err.status === 404;
    return (
      <>
        <PageHeader
          title="Work session"
          breadcrumbs={[
            { label: 'Review queue', href: '/work-sessions' },
            { label: sessionId },
          ]}
        />
        <div className="p-6">
          <AlertBanner
            tone="warning"
            title={isNotFound ? 'This session no longer exists' : 'Couldn’t load this session'}
            description={
              isNotFound
                ? 'It may have been resolved by the auto-release cron or removed by ops.'
                : err instanceof Error
                  ? err.message
                  : 'Unknown error'
            }
            action={
              <Link href="/work-sessions">
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

  if (!session) return null;

  const settled = isSettled(session);
  const cronTicking = isCronTicking(session);
  const buttonsEnabled = canActOnSession(session) && !optimisticInFlight && !cronTicking;
  const stateTone =
    session.verificationState === 'auto_review'
      ? 'warning'
      : session.verificationState === 'disputed'
        ? 'danger'
        : 'success';

  return (
    <>
      <PageHeader
        title={`${session.worker.fullName} · ${session.job.title}`}
        breadcrumbs={[
          { label: 'Review queue', href: '/work-sessions' },
          { label: session.id },
        ]}
        actions={
          <>
            {settled ? (
              isUnrated && pendingRatingForThisSession ? (
                <Button
                  leadingIcon={<IconStar className="!h-4 !w-4" />}
                  onClick={() => setShowRatingDialog(true)}
                >
                  Rate this worker
                </Button>
              ) : null
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-danger-600 hover:bg-danger-50"
                  disabled={!buttonsEnabled}
                  onClick={() => setShowDisputeDialog(true)}
                >
                  Dispute
                </Button>
                <Button
                  loading={confirmMutation.isPending || optimisticInFlight}
                  disabled={!buttonsEnabled}
                  onClick={() => setShowConfirmDialog(true)}
                >
                  Confirm payout
                </Button>
              </>
            )}
          </>
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

      {optimisticInFlight && !confirmMutation.isError ? (
        <div className="px-6 pt-4">
          <AlertBanner
            tone="info"
            title="Releasing payment…"
            description="We're settling the payout with Squad. This usually completes in a few seconds."
          />
        </div>
      ) : null}

      {cronTicking ? (
        <div className="px-6 pt-4">
          <AlertBanner
            tone="info"
            title="Auto-release in progress"
            description="The hold expired while you were here. Refreshing in 30 seconds…"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge tone={stateTone}>
                  {VERIFICATION_STATE_LABEL[session.verificationState]}
                </Badge>
                <span className="text-xs text-ink-muted" data-numeric>
                  · {session.id}
                </span>
              </div>
              <span
                className="text-2xl font-semibold text-ink tabular-nums"
                data-numeric
              >
                {formatCurrency(session.payAmountPendingNaira)}
              </span>
            </CardHeader>
            <CardBody>
              {session.proofPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.proofPhotoUrl}
                  alt="Clock-out proof"
                  className="aspect-[16/9] w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex aspect-[16/9] w-full items-center justify-center rounded-lg bg-surface-container-high text-ink-muted">
                  <IconCamera className="!h-6 !w-6" />
                  <span className="ml-2 text-sm">No proof photo uploaded</span>
                </div>
              )}

              {session.workerNote ? (
                <div className="mt-4 rounded-md border border-outline-variant bg-surface p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                    Worker note
                  </p>
                  <p className="mt-1 text-sm text-ink">{session.workerNote}</p>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clock events</CardTitle>
              <Badge tone={session.clockOut?.verified ? 'success' : 'warning'}>
                {session.clockOut?.verified ? 'GPS verified' : 'GPS flagged'}
              </Badge>
            </CardHeader>
            <CardBody>
              <KeyValueList
                items={[
                  {
                    label: 'Clock in',
                    value: formatAbsoluteDate(session.clockInAt),
                    hint: session.clockIn
                      ? `±${session.clockIn.gpsAccuracyMeters}m accuracy`
                      : undefined,
                  },
                  {
                    label: 'Clock out',
                    value: session.clockOutAt
                      ? formatAbsoluteDate(session.clockOutAt)
                      : '—',
                    hint: session.clockOut
                      ? `±${session.clockOut.gpsAccuracyMeters}m accuracy`
                      : undefined,
                  },
                  ...(session.durationHoursWorked != null
                    ? [
                        {
                          label: 'Duration worked',
                          value: `${session.durationHoursWorked.toFixed(1)}h`,
                        },
                      ]
                    : []),
                ]}
              />
            </CardBody>
          </Card>

          {session.verificationState === 'disputed' && session.dispute ? (
            <Card>
              <CardHeader>
                <CardTitle>Dispute</CardTitle>
                <Badge tone="danger">{session.dispute.status}</Badge>
              </CardHeader>
              <CardBody className="space-y-2">
                <p className="text-sm text-ink">
                  <span className="font-medium">Reason:</span>{' '}
                  {session.dispute.reason.replace(/_/g, ' ')}
                </p>
                {session.dispute.description ? (
                  <p className="text-sm text-ink-muted">
                    {session.dispute.description}
                  </p>
                ) : null}
                <p className="text-xs text-ink-muted">
                  Opened {formatRelativeTime(session.dispute.openedAt)}
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Worker</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar
                  name={session.worker.fullName}
                  src={session.worker.photoUrl ?? undefined}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {session.worker.fullName}
                  </p>
                  <p className="truncate text-xs text-ink-muted">
                    {session.worker.primarySkill ?? 'worker'}
                  </p>
                </div>
              </div>
              <Link href={`/workers/${session.worker.id}`}>
                <Button variant="secondary" className="w-full" size="sm">
                  Open profile
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <p className="font-medium text-ink">{session.job.title}</p>
              {session.job.location?.neighborhood || session.job.location?.address ? (
                <p className="inline-flex items-center gap-1 text-xs text-ink-muted">
                  <IconLocation className="!h-3 !w-3" />
                  {session.job.location?.neighborhood ?? session.job.location?.address}
                </p>
              ) : null}
              {session.job.scheduledStartAt || session.job.durationHours != null ? (
                <p className="text-xs text-ink-muted">
                  {session.job.scheduledStartAt ? (
                    <>Scheduled {formatAbsoluteDate(session.job.scheduledStartAt)}</>
                  ) : null}
                  {session.job.scheduledStartAt && session.job.durationHours != null
                    ? ' · '
                    : ''}
                  {session.job.durationHours != null ? (
                    <>{session.job.durationHours}h</>
                  ) : null}
                </p>
              ) : null}
              <Link href={`/jobs/${session.jobId}`}>
                <Button variant="secondary" className="mt-1 w-full" size="sm">
                  Open job
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hold window</CardTitle>
            </CardHeader>
            <CardBody>
              <HoldCountdown session={session} />
              {session.employerReviewedAt ? (
                <p className="mt-3 text-xs text-ink-muted">
                  <IconCheck className="!h-3 !w-3 -mt-0.5 mr-1 inline-block" />
                  Reviewed {formatRelativeTime(session.employerReviewedAt)}
                </p>
              ) : null}
              {session.transactionId ? (
                <p className="mt-2 text-xs text-ink-muted">
                  Payout · {session.transactionId}
                </p>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirmDialog}
        worker={session.worker.fullName}
        amount={session.payAmountPendingNaira}
        loading={confirmMutation.isPending || optimisticInFlight}
        onCancel={() => setShowConfirmDialog(false)}
        onSubmit={() => confirmMutation.mutate()}
      />

      <DisputeDialog
        open={showDisputeDialog}
        worker={session.worker.fullName}
        loading={disputeMutation.isPending}
        onCancel={() => setShowDisputeDialog(false)}
        onSubmit={(input) => disputeMutation.mutate(input)}
      />

      <RatingDialog
        open={showRatingDialog}
        sessions={pendingRatingForThisSession ? [pendingRatingForThisSession] : []}
        dismissible
        title="Rate this worker"
        description="Your rating helps other employers find reliable workers."
        onAllRated={() => {
          setShowRatingDialog(false);
          // The query invalidation inside RatingDialog refetches the inbox,
          // which then makes `isUnrated` flip to false and hides the CTA.
        }}
        onDismiss={() => setShowRatingDialog(false)}
      />

      {cronTicking ? <CronRefetcher onTick={() => void detailQuery.refetch()} /> : null}
    </>
  );
}

function HoldCountdown({ session }: { session: WorkSessionDto }) {
  const remaining = useCountdown(session.holdReleaseAt);
  if (isCronTicking(session)) {
    return (
      <p className="inline-flex items-center gap-2 text-sm font-medium text-info-700">
        <IconClock className="!h-4 !w-4" />
        Releasing now…
      </p>
    );
  }
  if (isSettled(session)) {
    return (
      <p className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted">
        <IconShield className="!h-4 !w-4" />
        Hold released
      </p>
    );
  }
  const urgent = remaining.totalMs < 10 * 60_000;
  return (
    <div>
      <p
        className={`inline-flex items-center gap-2 text-2xl font-semibold tabular-nums ${
          urgent ? 'text-warning-700' : 'text-ink'
        }`}
        data-numeric
      >
        {urgent ? <IconAlert className="!h-5 !w-5" /> : <IconClock className="!h-5 !w-5" />}
        {remaining.label}
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Auto-releases at {formatAbsoluteDate(session.holdReleaseAt)}
      </p>
    </div>
  );
}

function ConfirmDialog({
  open,
  worker,
  amount,
  loading,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  worker: string;
  amount: number;
  loading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onCancel() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Release payment to {worker}?</DialogTitle>
          <DialogDescription>
            {formatCurrency(amount)} will be disbursed immediately. The worker will see
            “payment processed” in their app.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button loading={loading} onClick={onSubmit}>
            Confirm payout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DisputeDialog({
  open,
  worker,
  loading,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  worker: string;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (input: { reason: DisputeReason; description?: string }) => void;
}) {
  const [reason, setReason] = useState<DisputeReason | ''>('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason('');
      setDescription('');
      setTouched(false);
    }
  }, [open]);

  const trimmedDescription = description.trim();
  const reasonOk = reason !== '';
  const descriptionRequiredForOther = reason === 'other';
  const descriptionOk = !descriptionRequiredForOther || trimmedDescription.length >= 5;
  const canSubmit = reasonOk && descriptionOk && !loading;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onCancel() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispute {worker}’s clock-out?</DialogTitle>
          <DialogDescription>
            Disputes are visible to the worker and may damage trust. Funds will stay in
            your wallet pending ops resolution.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <FormField
            label="Reason"
            required
            error={touched && !reasonOk ? 'Select a reason' : undefined}
          >
            <Select
              value={reason}
              onChange={(e) => setReason(e.target.value as DisputeReason | '')}
              options={[
                { label: 'Choose a reason…', value: '' },
                ...DISPUTE_REASONS.map((r) => ({ label: r.label, value: r.value })),
              ]}
            />
          </FormField>
          <FormField
            label={
              descriptionRequiredForOther
                ? 'Describe the issue'
                : 'Add context (optional)'
            }
            required={descriptionRequiredForOther}
            error={
              touched && descriptionRequiredForOther && !descriptionOk
                ? 'Add at least 5 characters'
                : undefined
            }
          >
            <Textarea
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="The worker can read this — keep it factual."
            />
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={loading}
            disabled={!canSubmit}
            onClick={() => {
              setTouched(true);
              if (!canSubmit) return;
              onSubmit({
                reason: reason as DisputeReason,
                description: trimmedDescription.length > 0 ? trimmedDescription : undefined,
              });
            }}
          >
            Open dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * When the hold expires but the BE hasn't flipped verification_state yet
 * (the cron runs every ~60s), retry the detail fetch on a fixed cadence
 * until the state moves to auto_released. Mounting only while
 * `isCronTicking(session)` keeps the timer scoped to the transition window.
 */
function CronRefetcher({ onTick }: { onTick: () => void }) {
  useEffect(() => {
    const id = window.setInterval(onTick, 30_000);
    return () => window.clearInterval(id);
  }, [onTick]);
  return null;
}

interface Remaining {
  totalMs: number;
  label: string;
}

function useCountdown(target: string): Remaining {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const targetMs = new Date(target).getTime();
  const totalMs = Math.max(0, targetMs - now);
  return { totalMs, label: formatDuration(totalMs) };
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

function handleActionError(
  err: unknown,
  handlers: {
    onStaleState?: () => void;
    onNotFound?: () => void;
    onProviderDown?: () => void;
    onGeneric: (message: string) => void;
  },
): void {
  if (err instanceof ApiError) {
    if (err.status === 404 || err.code === 'SESSION_NOT_FOUND') {
      handlers.onNotFound?.();
      return;
    }
    if (err.status === 409 || err.code === 'INVALID_STATE') {
      handlers.onStaleState?.();
      return;
    }
    if (err.status === 502 || err.code === 'PAYMENT_PROVIDER_UNAVAILABLE') {
      handlers.onProviderDown?.();
      return;
    }
    handlers.onGeneric(err.message);
    return;
  }
  handlers.onGeneric(err instanceof Error ? err.message : 'Something went wrong');
}
