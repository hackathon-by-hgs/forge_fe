'use client';

import Link from 'next/link';
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
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  FormField,
  Input,
  KeyValueList,
  MapPlaceholder,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
  Timeline,
  type TimelineItem,
} from '@forge/ui';
import {
  IconBriefcase,
  IconCalendar,
  IconCamera,
  IconClock,
  IconExternal,
  IconLocation,
  IconShield,
  IconUser,
} from '@forge/ui/icons';
import {
  formatAbsoluteDate,
  formatCurrency,
  formatDistance,
  formatRelativeTime,
} from '@forge/ui/utils';
import {
  acceptApplication,
  cancelJob,
  generateJobInvoice,
  getJob,
  getJobApplications,
  getJobProof,
  getJobTimeline,
  publishJob,
  rejectApplication,
  updateJob,
  type JobApplicationItemDto,
  type JobAudience,
  type JobDto,
  type JobProofResponse,
  type JobTypeWire,
  type UpdateJobInput,
} from '../../../lib/jobsApi';
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  JOB_STATUS_LABEL,
  JOB_STATUS_TONE,
  JOB_TYPE_LABEL,
  canCancelJob,
  canEditJob,
  canGenerateInvoice,
  canPublishJob,
  canShowProof,
  describeJobEvent,
} from '../../../lib/jobUtils';
import { ApiError } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { isHiringManager } from '../../../lib/roles';
import { toastApiError, toastSuccess } from '../../../lib/toast';

const TYPES: JobTypeWire[] = ['loader', 'driver', 'unloader', 'general'];
const AUDIENCES: JobAudience[] = ['public', 'team_first'];

export function JobDetailView({ jobId }: { jobId: string }) {
  const queryClient = useQueryClient();
  const role = useAuth((s) => s.user?.role);
  const hideInvoice = isHiringManager(role);

  const jobQuery = useQuery({
    queryKey: ['employer', 'jobs', 'detail', jobId],
    queryFn: () => getJob(jobId),
    retry: false,
  });
  const timelineQuery = useQuery({
    queryKey: ['employer', 'jobs', 'timeline', jobId],
    queryFn: () => getJobTimeline(jobId),
    retry: false,
    enabled: !jobQuery.isError,
  });
  const applicationsQuery = useQuery({
    queryKey: ['employer', 'jobs', 'applications', jobId],
    queryFn: () => getJobApplications(jobId),
    retry: false,
    enabled: !jobQuery.isError,
  });

  const job = jobQuery.data;
  const proofQuery = useQuery({
    queryKey: ['employer', 'jobs', 'proof', jobId],
    queryFn: () => getJobProof(jobId),
    retry: false,
    enabled: Boolean(job && canShowProof(job.status)),
  });

  const [actionError, setActionError] = useState<string | null>(null);

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['employer', 'jobs', 'detail', jobId] });
    void queryClient.invalidateQueries({
      queryKey: ['employer', 'jobs', 'applications', jobId],
    });
    void queryClient.invalidateQueries({
      queryKey: ['employer', 'jobs', 'timeline', jobId],
    });
    void queryClient.invalidateQueries({ queryKey: ['employer', 'jobs'] });
    void queryClient.invalidateQueries({ queryKey: ['employer', 'overview'] });
  };

  const publishMutation = useMutation({
    mutationFn: () => publishJob(jobId),
    onSuccess: (job) => {
      invalidateAll();
      toastSuccess('Job published', {
        description: `“${job.title}” is now visible to workers.`,
      });
    },
    onError: (err) => {
      setActionError(humanError(err));
      toastApiError(err, 'Couldn’t publish the job');
    },
  });

  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => cancelJob(jobId, reason),
    onSuccess: (job) => {
      invalidateAll();
      setShowCancel(false);
      setCancelReason('');
      toastSuccess('Job cancelled', {
        description: `“${job.title}” has been cancelled and pending applications were rejected.`,
      });
    },
    onError: (err) => {
      setActionError(humanError(err));
      toastApiError(err, 'Couldn’t cancel the job');
    },
  });

  const [showEdit, setShowEdit] = useState(false);

  const [invoiceResult, setInvoiceResult] = useState<{ number: string } | null>(null);
  const invoiceMutation = useMutation({
    mutationFn: () => generateJobInvoice(jobId, {}),
    onSuccess: (inv) => {
      setInvoiceResult({ number: inv.number });
      invalidateAll();
      toastSuccess(`Invoice ${inv.number} created`, {
        description: 'The PDF will be available once processing finishes.',
      });
    },
    onError: (err) => {
      setActionError(humanError(err));
      toastApiError(err, 'Couldn’t generate the invoice');
    },
  });

  if (jobQuery.isLoading) {
    return (
      <>
        <PageHeader
          title="Loading job…"
          breadcrumbs={[{ label: 'Jobs', href: '/jobs/active' }, { label: jobId }]}
        />
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  if (jobQuery.isError) {
    const err = jobQuery.error;
    const isNotFound = err instanceof ApiError && err.status === 404;
    return (
      <>
        <PageHeader
          title="Job"
          breadcrumbs={[{ label: 'Jobs', href: '/jobs/active' }, { label: jobId }]}
        />
        <div className="p-6">
          <AlertBanner
            tone="warning"
            title={isNotFound ? 'This job no longer exists' : 'Couldn’t load this job'}
            description={
              isNotFound
                ? 'It may have been removed, or you don’t have access.'
                : err instanceof Error
                  ? err.message
                  : 'Unknown error'
            }
            action={
              <Link href="/jobs/active">
                <Button size="sm" variant="secondary">
                  Back to jobs
                </Button>
              </Link>
            }
          />
        </div>
      </>
    );
  }

  if (!job) return null;

  const editable = canEditJob(job.status);
  const publishable = canPublishJob(job.status);
  const cancellable = canCancelJob(job.status);
  const showProof = canShowProof(job.status);
  const showInvoice = canGenerateInvoice(job.status) && !hideInvoice;

  const timelineItems: TimelineItem[] = (timelineQuery.data?.data ?? []).map((ev) => {
    const copy = describeJobEvent(ev.kind, ev.payload);
    return {
      id: ev.id,
      title: copy.label,
      tone: copy.tone,
      timestamp: formatRelativeTime(ev.occurredAt),
      icon: eventIcon(ev.kind),
    };
  });

  const apps = applicationsQuery.data?.data ?? [];

  return (
    <>
      <PageHeader
        title={job.title}
        breadcrumbs={[
          { label: 'Jobs', href: '/jobs/active' },
          { label: job.id },
        ]}
        actions={
          <>
            {editable ? (
              <Button variant="secondary" onClick={() => setShowEdit(true)}>
                Edit
              </Button>
            ) : null}
            {publishable ? (
              <Button
                loading={publishMutation.isPending}
                onClick={() => publishMutation.mutate()}
              >
                Publish
              </Button>
            ) : null}
            {cancellable ? (
              <Button
                variant="ghost"
                className="text-danger-600 hover:bg-danger-50"
                onClick={() => setShowCancel(true)}
              >
                Cancel job
              </Button>
            ) : null}
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

      {invoiceResult ? (
        <div className="px-6 pt-4">
          <AlertBanner
            tone="success"
            title={`Invoice ${invoiceResult.number} created`}
            description="The PDF will be available once payments processing finishes generating it."
            onDismiss={() => setInvoiceResult(null)}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge tone={JOB_STATUS_TONE[job.status]}>
                  {JOB_STATUS_LABEL[job.status]}
                </Badge>
                <span className="text-xs text-neutral-500" data-numeric>
                  · {job.id}
                </span>
                {job.audience === 'team_first' ? (
                  <Badge tone="accent" variant="outline">
                    Team first
                  </Badge>
                ) : null}
              </div>
              <span
                className="text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {formatCurrency(job.payNaira)}
              </span>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="whitespace-pre-line text-sm text-neutral-700">
                {job.description}
              </p>
              <KeyValueList
                layout="grid"
                items={[
                  { label: 'Job type', value: JOB_TYPE_LABEL[job.type] },
                  { label: 'Duration', value: `${job.durationHours}h` },
                  {
                    label: 'Scheduled start',
                    value: formatAbsoluteDate(job.scheduledStartAt),
                  },
                  {
                    label: 'Location',
                    value: job.location.neighborhood ?? job.location.address,
                  },
                  { label: 'Posted', value: formatRelativeTime(job.postedAt) },
                  {
                    label: 'Geofence',
                    value: `${job.geofenceRadiusMeters}m`,
                  },
                ]}
              />
              {job.requiredEquipment.length ? (
                <div>
                  <p className="mb-1 text-xs font-medium text-neutral-700">
                    Required equipment
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredEquipment.map((e) => (
                      <Badge key={e} variant="outline">
                        {e}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {job.cancelledReason ? (
                <p className="text-xs text-danger-700">
                  Cancelled · {job.cancelledReason}
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status timeline</CardTitle>
              {timelineQuery.isFetching && !timelineQuery.isLoading ? (
                <span className="text-xs text-neutral-500">Updating…</span>
              ) : null}
            </CardHeader>
            <CardBody>
              {timelineQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : timelineItems.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No activity yet. Events will appear here as the job progresses.
                </p>
              ) : (
                <Timeline items={timelineItems} />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job site</CardTitle>
              <span className="text-xs text-neutral-500">
                <IconLocation className="!h-3 !w-3 -mt-0.5 mr-0.5 inline-block" />
                {job.location.neighborhood ?? job.location.address}, Lagos
              </span>
            </CardHeader>
            <CardBody>
              <MapPlaceholder
                pins={[
                  {
                    id: job.id,
                    lat: job.location.lat,
                    lng: job.location.lng,
                    tone: 'accent',
                  },
                ]}
                googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                className="aspect-[16/8]"
              />
            </CardBody>
          </Card>

          {showProof ? (
            <ProofCard
              isLoading={proofQuery.isLoading}
              data={proofQuery.data}
              error={proofQuery.error}
              onRetry={() => void proofQuery.refetch()}
            />
          ) : null}
        </div>

        <div className="space-y-6">
          {job.assignedWorker ? (
            <Card>
              <CardHeader>
                <CardTitle>Assigned worker</CardTitle>
              </CardHeader>
              <CardBody className="space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={job.assignedWorker.fullName}
                    src={job.assignedWorker.photoUrl ?? undefined}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {job.assignedWorker.fullName}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {JOB_TYPE_LABEL[job.assignedWorker.primarySkill]}
                    </p>
                  </div>
                </div>
                <Link href={`/workers/${job.assignedWorker.id}`}>
                  <Button
                    variant="secondary"
                    className="w-full"
                    trailingIcon={<IconExternal className="!h-4 !w-4" />}
                  >
                    Open worker
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ) : null}

          <ApplicationsCard
            jobId={jobId}
            apps={apps}
            isLoading={applicationsQuery.isLoading}
            isError={applicationsQuery.isError}
            error={applicationsQuery.error}
            jobStatus={job.status}
            onRetry={() => void applicationsQuery.refetch()}
            onAfterMutate={invalidateAll}
            onActionError={setActionError}
          />

          {showInvoice ? (
            <Card>
              <CardHeader>
                <CardTitle>Invoice</CardTitle>
                <Badge tone="success" variant="soft">
                  Completed
                </Badge>
              </CardHeader>
              <CardBody className="space-y-2 text-sm text-neutral-600">
                <p>
                  Generate a single-job invoice for the completed work. The PDF is
                  rendered asynchronously.
                </p>
                <Button
                  className="w-full"
                  loading={invoiceMutation.isPending}
                  onClick={() => invoiceMutation.mutate()}
                >
                  Generate invoice
                </Button>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex items-start gap-3 text-sm">
                <IconCalendar className="!h-4 !w-4 text-neutral-400" />
                <div>
                  <p className="font-medium text-neutral-900">
                    {formatAbsoluteDate(job.scheduledStartAt)}
                  </p>
                  <p className="text-xs text-neutral-500">{job.durationHours}h shift</p>
                </div>
              </div>
              {job.startedAt ? (
                <p className="mt-2 text-xs text-neutral-500">
                  Clocked in {formatRelativeTime(job.startedAt)}
                </p>
              ) : null}
              {job.completedAt ? (
                <p className="mt-1 text-xs text-neutral-500">
                  Completed {formatRelativeTime(job.completedAt)}
                </p>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>

      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this job?</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <p className="text-sm text-neutral-600">
              Cancelling “{job.title}” auto-rejects every pending application and notifies
              the assigned worker if there is one. This cannot be undone.
            </p>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-700">
                Reason (optional)
              </span>
              <Textarea
                rows={3}
                placeholder="Workers see this reason."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </label>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCancel(false)}>
              Keep job
            </Button>
            <Button
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(cancelReason.trim() || undefined)}
            >
              Cancel job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Drawer open={showEdit} onOpenChange={setShowEdit}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit job</DrawerTitle>
          </DrawerHeader>
          <EditJobDrawer
            job={job}
            onSaved={() => {
              setShowEdit(false);
              invalidateAll();
            }}
            onClose={() => setShowEdit(false)}
            onError={(msg) => setActionError(msg)}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}

function eventIcon(kind: string) {
  switch (kind) {
    case 'job_posted':
    case 'job_published':
    case 'audience_flipped':
      return <IconBriefcase className="!h-3.5 !w-3.5" />;
    case 'application_received':
    case 'application_accepted':
    case 'application_rejected':
      return <IconUser className="!h-3.5 !w-3.5" />;
    case 'worker_clocked_in':
    case 'worker_late':
    case 'worker_clocked_out':
      return <IconClock className="!h-3.5 !w-3.5" />;
    case 'photo_proof_uploaded':
      return <IconCamera className="!h-3.5 !w-3.5" />;
    case 'job_completed':
      return <IconShield className="!h-3.5 !w-3.5" />;
    default:
      return undefined;
  }
}

function ApplicationsCard({
  jobId,
  apps,
  isLoading,
  isError,
  error,
  jobStatus,
  onRetry,
  onAfterMutate,
  onActionError,
}: {
  jobId: string;
  apps: JobApplicationItemDto[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  jobStatus: JobDto['status'];
  onRetry: () => void;
  onAfterMutate: () => void;
  onActionError: (msg: string) => void;
}) {
  const accept = useMutation({
    mutationFn: (appId: string) => acceptApplication(jobId, appId),
    onSuccess: (app) => {
      onAfterMutate();
      toastSuccess(`Accepted ${app.worker.fullName}`, {
        description: 'They’ve been notified and will show up for the shift.',
      });
    },
    onError: (err) => {
      onActionError(humanError(err));
      toastApiError(err, 'Couldn’t accept the application');
    },
  });

  const reject = useMutation({
    mutationFn: (appId: string) => rejectApplication(jobId, appId),
    onSuccess: (app) => {
      onAfterMutate();
      toastSuccess(`Rejected ${app.worker.fullName}`, {
        description: 'They won’t be assigned to this job.',
      });
    },
    onError: (err) => {
      onActionError(humanError(err));
      toastApiError(err, 'Couldn’t reject the application');
    },
  });

  const canDecide = jobStatus === 'open' || jobStatus === 'applications_in';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications</CardTitle>
        <Badge tone="info">{apps.length}</Badge>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : isError ? (
          <AlertBanner
            tone="danger"
            title="Couldn’t load applications"
            description={error instanceof Error ? error.message : 'Unknown error'}
            action={
              <Button size="sm" variant="secondary" onClick={onRetry}>
                Retry
              </Button>
            }
          />
        ) : apps.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No applications yet. Workers will appear here once they apply.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {apps.map((a) => {
              const decidingThis =
                (accept.isPending && accept.variables === a.id) ||
                (reject.isPending && reject.variables === a.id);
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Avatar
                    name={a.worker.fullName}
                    src={a.worker.photoUrl ?? undefined}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/workers/${a.workerId}`}
                      className="block truncate text-sm font-medium text-neutral-900 hover:underline"
                    >
                      {a.worker.fullName}
                    </Link>
                    <p className="truncate text-xs text-neutral-500">
                      Score {a.worker.reliabilityScore} ·{' '}
                      {a.distanceMeters != null
                        ? formatDistance(a.distanceMeters)
                        : 'distance unknown'}{' '}
                      · rank {(a.rankScore * 100).toFixed(0)}
                    </p>
                  </div>
                  <Badge tone={APPLICATION_STATUS_TONE[a.status] ?? 'neutral'}>
                    {APPLICATION_STATUS_LABEL[a.status] ?? a.status}
                  </Badge>
                  {a.status === 'pending' && canDecide ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => reject.mutate(a.id)}
                        loading={
                          decidingThis &&
                          reject.isPending &&
                          reject.variables === a.id
                        }
                        className="text-neutral-600"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => accept.mutate(a.id)}
                        loading={
                          decidingThis &&
                          accept.isPending &&
                          accept.variables === a.id
                        }
                      >
                        Accept
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function ProofCard({
  isLoading,
  data,
  error,
  onRetry,
}: {
  isLoading: boolean;
  data: JobProofResponse | undefined;
  error: unknown;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Completion proof</CardTitle>
        </CardHeader>
        <CardBody>
          <Skeleton className="h-32 w-full" />
        </CardBody>
      </Card>
    );
  }
  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Completion proof</CardTitle>
        </CardHeader>
        <CardBody>
          <AlertBanner
            tone="warning"
            title="Couldn’t load proof"
            description={error instanceof Error ? error.message : 'Unknown error'}
            action={
              <Button size="sm" variant="secondary" onClick={onRetry}>
                Retry
              </Button>
            }
          />
        </CardBody>
      </Card>
    );
  }

  const verdictTone =
    data.gpsVerification.overall === 'verified'
      ? 'success'
      : data.gpsVerification.overall === 'flagged'
        ? 'danger'
        : 'neutral';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Completion proof</CardTitle>
        <Badge tone={verdictTone}>{data.gpsVerification.overall}</Badge>
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {data.photos.length === 0 ? (
            <div className="col-span-2 flex aspect-[16/6] items-center justify-center rounded-md bg-neutral-50 text-xs text-neutral-400">
              No photos uploaded yet
            </div>
          ) : (
            data.photos.slice(0, 4).map((p) => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-md bg-neutral-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={`Proof ${p.id}`}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="absolute right-1 top-1 rounded-full bg-black/40 p-0.5 text-white opacity-0 group-hover:opacity-100">
                  <IconExternal className="!h-3 !w-3" />
                </span>
              </a>
            ))
          )}
        </div>
        <KeyValueList
          items={data.clockEvents.map((ev) => ({
            label: ev.kind === 'clock_in' ? 'Clock in' : 'Clock out',
            value: (
              <span className="inline-flex items-center gap-1.5">
                {formatAbsoluteDate(ev.at)}
                {ev.verified ? (
                  <Badge tone="success" variant="soft">
                    GPS ok
                  </Badge>
                ) : (
                  <Badge tone="danger" variant="soft">
                    GPS flag
                  </Badge>
                )}
              </span>
            ),
            hint: `±${ev.gpsAccuracyMeters}m accuracy`,
          }))}
        />
      </CardBody>
    </Card>
  );
}

function EditJobDrawer({
  job,
  onSaved,
  onClose,
  onError,
}: {
  job: JobDto;
  onSaved: () => void;
  onClose: () => void;
  onError: (msg: string) => void;
}) {
  const [title, setTitle] = useState(job.title);
  const [description, setDescription] = useState(job.description);
  const [type, setType] = useState<JobTypeWire>(job.type);
  const [payNaira, setPayNaira] = useState<number>(job.payNaira);
  const [durationHours, setDurationHours] = useState<number>(job.durationHours);
  const [scheduledStartAt, setScheduledStartAt] = useState<string>(
    toDatetimeLocal(job.scheduledStartAt),
  );
  const [audience, setAudience] = useState<JobAudience>(job.audience);
  const [geofence, setGeofence] = useState<number>(job.geofenceRadiusMeters);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutate = useMutation({
    mutationFn: (input: UpdateJobInput) => updateJob(job.id, input),
    onSuccess: (updated) => {
      onSaved();
      toastSuccess('Job updated', {
        description: `Changes to “${updated.title}” are saved.`,
      });
    },
    onError: (err) => {
      const fe = fieldErrorsFromApi(err);
      if (fe) {
        setFieldErrors(fe);
        toastApiError(err, 'Please fix the highlighted fields');
        return;
      }
      onError(humanError(err));
      toastApiError(err, 'Couldn’t save your changes');
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const localErrors: Record<string, string> = {};
    if (title.trim().length < 3) localErrors.title = 'Title must be at least 3 characters';
    if (description.trim().length < 10) localErrors.description = 'Add a longer description';
    if (payNaira < 1500) localErrors.payNaira = 'Minimum pay is ₦1,500';
    if (durationHours < 1 || durationHours > 24)
      localErrors.durationHours = 'Duration must be 1–24h';
    if (geofence < 50 || geofence > 2000)
      localErrors.geofence = 'Geofence must be 50–2000m';
    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors);
      return;
    }
    mutate.mutate({
      title,
      description,
      type,
      payNaira,
      durationHours,
      scheduledStartAt: new Date(scheduledStartAt).toISOString(),
      audience,
      geofenceRadiusMeters: geofence,
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col">
      <DrawerBody className="space-y-4">
        <FormField label="Title" required error={fieldErrors.title}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField label="Description" required error={fieldErrors.description}>
          <Textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
        <FormField label="Type" required>
          <Select
            options={TYPES.map((t) => ({ label: JOB_TYPE_LABEL[t], value: t }))}
            value={type}
            onChange={(e) => setType(e.target.value as JobTypeWire)}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Pay (₦)" required error={fieldErrors.payNaira}>
            <Input
              type="number"
              min={1500}
              step={500}
              value={payNaira}
              onChange={(e) => setPayNaira(Number(e.target.value))}
            />
          </FormField>
          <FormField label="Duration (hrs)" required error={fieldErrors.durationHours}>
            <Input
              type="number"
              min={1}
              max={24}
              step={1}
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
            />
          </FormField>
        </div>
        <FormField label="Scheduled start" required>
          <Input
            type="datetime-local"
            value={scheduledStartAt}
            onChange={(e) => setScheduledStartAt(e.target.value)}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Audience">
            <Select
              options={AUDIENCES.map((a) => ({
                label: a === 'public' ? 'Public' : 'Team first',
                value: a,
              }))}
              value={audience}
              onChange={(e) => setAudience(e.target.value as JobAudience)}
            />
          </FormField>
          <FormField label="Geofence (m)" error={fieldErrors.geofence}>
            <Input
              type="number"
              min={50}
              max={2000}
              step={50}
              value={geofence}
              onChange={(e) => setGeofence(Number(e.target.value))}
            />
          </FormField>
        </div>
      </DrawerBody>
      <DrawerFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={mutate.isPending}>
          Save
        </Button>
      </DrawerFooter>
    </form>
  );
}

function humanError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

function fieldErrorsFromApi(err: unknown): Record<string, string> | null {
  if (!(err instanceof ApiError) || err.code !== 'VALIDATION_FAILED') return null;
  const errors =
    (err.details?.errors as Array<{ field?: string; message?: string }>) ?? [];
  const out: Record<string, string> = {};
  for (const e of errors) {
    if (e?.field) out[e.field] = e.message ?? 'Invalid value';
  }
  return Object.keys(out).length ? out : null;
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
