'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertBanner,
  Avatar,
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  type DataTableColumn,
} from '@forge/ui';
import { formatCurrency, formatRelativeTime } from '@forge/ui/utils';
import { IconBriefcase } from '@forge/ui/icons';
import {
  JOB_STATUS_LABEL,
  JOB_STATUS_TONE,
  KANBAN_COLUMNS,
  canCancelJob,
} from '../../../lib/jobUtils';
import { cancelJob, type JobDto } from '../../../lib/jobsApi';

const COLUMN_CAP = 50;

export interface ActiveJobsViewProps {
  jobs: JobDto[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}

export function ActiveJobsView({
  jobs,
  isLoading,
  isError,
  error,
  onRetry,
}: ActiveJobsViewProps) {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [cancelTarget, setCancelTarget] = useState<JobDto | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => cancelJob(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employer', 'jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['employer', 'overview'] });
      setCancelTarget(null);
      setCancelReason('');
      setCancelError(null);
    },
    onError: (err) => {
      setCancelError(err instanceof Error ? err.message : 'Could not cancel job');
    },
  });

  const columns: DataTableColumn<JobDto>[] = [
    {
      key: 'title',
      header: 'Job',
      sortBy: (j) => j.title,
      cell: (j) => (
        <Link href={`/jobs/${j.id}`} className="font-medium text-neutral-900 hover:underline">
          {j.title}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortBy: (j) => j.status,
      cell: (j) => (
        <Badge tone={JOB_STATUS_TONE[j.status]}>{JOB_STATUS_LABEL[j.status]}</Badge>
      ),
    },
    {
      key: 'pay',
      header: 'Pay',
      align: 'right',
      sortBy: (j) => j.payNaira,
      cellClassName: 'tabular-nums',
      cell: (j) => formatCurrency(j.payNaira),
    },
    {
      key: 'location',
      header: 'Location',
      sortBy: (j) => j.location.neighborhood ?? '',
      cell: (j) => j.location.neighborhood ?? '—',
    },
    {
      key: 'worker',
      header: 'Worker',
      cell: (j) =>
        j.assignedWorker ? (
          <div className="flex items-center gap-2">
            <Avatar
              name={j.assignedWorker.fullName}
              src={j.assignedWorker.photoUrl ?? undefined}
              size="sm"
            />
            <span className="text-xs">{j.assignedWorker.fullName}</span>
          </div>
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        ),
    },
    {
      key: 'posted',
      header: 'Posted',
      sortBy: (j) => j.postedAt,
      cell: (j) => (
        <span className="text-neutral-500">{formatRelativeTime(j.postedAt)}</span>
      ),
    },
    {
      key: 'apps',
      header: 'Apps',
      align: 'right',
      sortBy: (j) => j.applicationsCount,
      cellClassName: 'tabular-nums',
      cell: (j) => j.applicationsCount,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (j) =>
        canCancelJob(j.status) ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-danger-600 hover:bg-danger-50"
            onClick={(e) => {
              e.preventDefault();
              setCancelTarget(j);
              setCancelError(null);
            }}
          >
            Cancel
          </Button>
        ) : null,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {KANBAN_COLUMNS.map((col) => (
          <div
            key={col.status}
            className="flex min-h-[60vh] flex-col gap-2 rounded-xl border border-outline bg-surface-container-high p-2"
          >
            <p className="px-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-600">
              {col.label}
            </p>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg border border-outline bg-surface"
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <AlertBanner
        tone="danger"
        title="Couldn’t load active jobs"
        description={error instanceof Error ? error.message : 'Unknown error'}
        action={
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <>
      <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'table')}>
        <TabsList>
          <TabsTrigger value="kanban">Board</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          {jobs.length === 0 ? (
            <EmptyState
              icon={<IconBriefcase className="!h-5 !w-5" />}
              title="No active jobs"
              description="Post a job to start hiring."
              action={
                <Link href="/jobs/new">
                  <Button>Post a job</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {KANBAN_COLUMNS.map((col) => {
                const items = jobs.filter((j) => j.status === col.status);
                const visible = items.slice(0, COLUMN_CAP);
                const overflow = items.length - visible.length;
                return (
                  <div
                    key={col.status}
                    className="flex min-h-[60vh] flex-col gap-2 rounded-xl border border-outline bg-surface-container-high p-2"
                  >
                    <div className="flex items-center justify-between px-1.5 py-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                        {col.label}
                      </p>
                      <Badge variant="soft">{items.length}</Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      {visible.length === 0 ? (
                        <p className="px-1.5 py-4 text-center text-xs text-neutral-400">
                          Nothing here yet
                        </p>
                      ) : (
                        visible.map((j) => (
                          <Link
                            key={j.id}
                            href={`/jobs/${j.id}`}
                            className="block rounded-lg border border-outline bg-surface p-2.5 text-sm transition-colors hover:bg-surface-container-high"
                          >
                            <p className="line-clamp-2 font-medium text-neutral-900">
                              {j.title}
                            </p>
                            <div className="mt-1.5 flex items-center justify-between text-xs text-neutral-500">
                              <span>{j.location.neighborhood ?? '—'}</span>
                              <span
                                className="font-medium text-neutral-900 tabular-nums"
                                data-numeric
                              >
                                {formatCurrency(j.payNaira)}
                              </span>
                            </div>
                            {j.assignedWorker ? (
                              <div className="mt-2 flex items-center gap-1.5">
                                <Avatar
                                  name={j.assignedWorker.fullName}
                                  src={j.assignedWorker.photoUrl ?? undefined}
                                  size="sm"
                                />
                                <span className="text-xs text-neutral-600">
                                  {j.assignedWorker.fullName}
                                </span>
                              </div>
                            ) : j.applicationsCount > 0 ? (
                              <p className="mt-2 text-xs text-info-600">
                                {j.applicationsCount} applications
                              </p>
                            ) : null}
                          </Link>
                        ))
                      )}
                      {overflow > 0 ? (
                        <Link
                          href={`/jobs?status=${col.status}`}
                          className="px-1.5 py-2 text-center text-xs font-medium text-accent-600 hover:underline"
                        >
                          View all {items.length} →
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <DataTable
            data={jobs}
            columns={columns}
            rowKey={(j) => j.id}
            emptyTitle="No active jobs"
            emptyDescription="Post a job to start hiring."
            pagination={{ pageSizeOptions: [10, 25, 50, 100], itemLabel: 'job' }}
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null);
            setCancelReason('');
            setCancelError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this job?</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <p className="text-sm text-neutral-600">
              Cancelling “{cancelTarget?.title}” auto-rejects all pending applications and
              notifies the assigned worker if there is one. This cannot be undone.
            </p>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-700">
                Reason (optional)
              </span>
              <Textarea
                rows={3}
                placeholder="Why are you cancelling? Workers see this."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </label>
            {cancelError ? (
              <p className="text-xs text-danger-600">{cancelError}</p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setCancelTarget(null);
                setCancelReason('');
                setCancelError(null);
              }}
            >
              Keep job
            </Button>
            <Button
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() => {
                if (!cancelTarget) return;
                cancelMutation.mutate({
                  id: cancelTarget.id,
                  reason: cancelReason.trim() || undefined,
                });
              }}
            >
              Cancel job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
