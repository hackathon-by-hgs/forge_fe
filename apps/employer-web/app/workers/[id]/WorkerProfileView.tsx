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
  EmptyState,
  KeyValueList,
  PageHeader,
  RadialProgress,
  Skeleton,
  Textarea,
} from '@forge/ui';
import { IconAdd, IconBriefcase, IconLocation } from '@forge/ui/icons';
import {
  formatAbsoluteDate,
  formatCurrency,
  formatRelativeTime,
} from '@forge/ui/utils';
import { ApiError } from '../../../lib/api';
import {
  addTeamMember,
  blockWorker,
  getWorker,
  getWorkerJobs,
  removeTeamMember,
  unblockWorker,
} from '../../../lib/workersApi';
import { PastJobsList } from './PastJobsList';

export function WorkerProfileView({ workerId }: { workerId: string }) {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['employer', 'workers', 'detail', workerId],
    queryFn: () => getWorker(workerId),
    retry: false,
  });

  const jobsQuery = useQuery({
    queryKey: ['employer', 'workers', 'jobs', workerId],
    queryFn: () => getWorkerJobs(workerId, 1, 50),
    retry: false,
    enabled: !profileQuery.isError,
  });

  const [showBlock, setShowBlock] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ['employer', 'workers', 'detail', workerId],
    });
    void queryClient.invalidateQueries({ queryKey: ['employer', 'workers'] });
  };

  const teamMutation = useMutation<void, unknown, boolean>({
    mutationFn: async (add) => {
      if (add) {
        await addTeamMember(workerId);
      } else {
        await removeTeamMember(workerId);
      }
    },
    onSuccess: invalidate,
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not update team'),
  });

  const blockMutation = useMutation<void, unknown, boolean>({
    mutationFn: async (block) => {
      if (block) {
        await blockWorker(workerId, blockReason.trim() || undefined);
      } else {
        await unblockWorker(workerId);
      }
    },
    onSuccess: () => {
      invalidate();
      setShowBlock(false);
      setBlockReason('');
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not change block state'),
  });

  if (profileQuery.isLoading) {
    return (
      <>
        <PageHeader title="Loading worker…" breadcrumbs={[{ label: 'Profile' }]} />
        <div className="space-y-6 p-6">
          {/* Hero: avatar + name/skill + score radial */}
          <div className="flex items-center gap-4 rounded-xl border border-outline bg-surface p-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-14 w-14 rounded-full" />
          </div>
          {/* Reliability + earnings tiles */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          {/* Past jobs table */}
          <div className="rounded-xl border border-outline bg-surface p-4">
            <Skeleton className="mb-3 h-5 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (profileQuery.isError) {
    const err = profileQuery.error;
    const isNotFound = err instanceof ApiError && err.status === 404;
    return (
      <>
        <PageHeader title="Worker" breadcrumbs={[{ label: 'Profile' }]} />
        <div className="p-6">
          <AlertBanner
            tone="warning"
            title={
              isNotFound ? 'Worker not visible to your business' : 'Couldn’t load worker'
            }
            description={
              isNotFound
                ? "Either the worker doesn't exist or you don't have access."
                : err instanceof Error
                  ? err.message
                  : 'Unknown error'
            }
            action={
              <Link href="/workers/browse">
                <Button size="sm" variant="secondary">
                  Browse workers
                </Button>
              </Link>
            }
          />
        </div>
      </>
    );
  }

  const w = profileQuery.data;
  if (!w) return null;
  const pastJobs = jobsQuery.data?.data ?? [];

  return (
    <>
      <PageHeader
        title={w.fullName}
        breadcrumbs={[
          { label: 'Workers', href: '/workers/active' },
          { label: 'Profile' },
        ]}
        actions={
          <>
            {w.blocked ? (
              <Button
                variant="ghost"
                onClick={() => blockMutation.mutate(false)}
                loading={blockMutation.isPending}
              >
                Unblock
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="text-danger-600 hover:bg-danger-50"
                onClick={() => setShowBlock(true)}
              >
                Block worker
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => teamMutation.mutate(!w.onTeam)}
              loading={teamMutation.isPending}
            >
              {w.onTeam ? 'Remove from team' : 'Save to team'}
            </Button>
            <Link href="/jobs/new">
              <Button leadingIcon={<IconAdd className="!h-4 !w-4" />}>
                Hire for a job
              </Button>
            </Link>
          </>
        }
      />

      {error ? (
        <div className="px-6 pt-4">
          <AlertBanner
            tone="danger"
            title="Action failed"
            description={error}
            onDismiss={() => setError(null)}
          />
        </div>
      ) : null}

      <div className="space-y-6 p-6">
        <Card>
          <CardBody>
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <Avatar
                name={w.fullName}
                src={w.photoUrl ?? undefined}
                size="lg"
                className="!h-20 !w-20 !text-base"
              />
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-2xl font-semibold text-neutral-900">{w.fullName}</p>
                  <Badge variant="soft">{w.primarySkill}</Badge>
                  {w.onTeam ? <Badge tone="accent" variant="soft">On team</Badge> : null}
                  {w.blocked ? <Badge tone="danger">Blocked</Badge> : null}
                  {w.eligibility === 'pre_approved' ? (
                    <Badge tone="success">Pre-approved</Badge>
                  ) : w.eligibility === 'eligible' ? (
                    <Badge tone="info">Eligible</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-neutral-500">
                  Member since {formatAbsoluteDate(w.joinedAt)}
                </p>
                {w.homeNeighborhood ? (
                  <p className="inline-flex items-center gap-1 text-xs text-neutral-500">
                    <IconLocation className="!h-3 !w-3" />
                    {w.homeNeighborhood}
                  </p>
                ) : null}
              </div>
              <RadialProgress value={w.reliabilityScore} label="Reliability" />
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardBody>
              <p className="text-xs text-neutral-500">Total jobs</p>
              <p
                className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {w.jobsCompleted}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-neutral-500">Lifetime earned</p>
              <p
                className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {formatCurrency(w.totalEarnedNaira, { compact: true })}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-neutral-500">On-time rate</p>
              <p
                className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {(w.onTimeRate * 100).toFixed(0)}%
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-neutral-500">Average rating</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums">
                ★ {w.averageRating.toFixed(1)}
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Jobs with us</CardTitle>
              <Badge>{w.pastJobsWithEmployerCount}</Badge>
            </CardHeader>
            <CardBody>
              {jobsQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : pastJobs.length === 0 ? (
                <EmptyState
                  icon={<IconBriefcase className="!h-5 !w-5" />}
                  title="No prior jobs together"
                  description="Hire this worker for a job and their history with you will appear here."
                  action={
                    <Link href="/jobs/new">
                      <Button>Hire for a job</Button>
                    </Link>
                  }
                />
              ) : (
                <PastJobsList jobs={pastJobs} />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent reviews</CardTitle>
            </CardHeader>
            <CardBody>
              {w.recentReviews.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No reviews yet — first job for you will produce one.
                </p>
              ) : (
                <ul className="space-y-4">
                  {w.recentReviews.map((r) => (
                    <li key={r.id}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-900">
                          {r.employerName}
                        </p>
                        <span className="text-xs text-warning-500">
                          {'★'.repeat(r.rating)}
                          <span className="text-neutral-200">
                            {'★'.repeat(5 - r.rating)}
                          </span>
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-600">{r.body}</p>
                      <p className="mt-0.5 text-[10px] text-neutral-400">
                        {formatRelativeTime(r.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reliability snapshot</CardTitle>
          </CardHeader>
          <CardBody>
            <KeyValueList
              layout="grid"
              items={[
                {
                  label: 'Member since',
                  value: formatAbsoluteDate(w.reliabilitySnapshot.memberSince),
                },
                {
                  label: 'Jobs completed',
                  value: w.reliabilitySnapshot.jobsCompleted,
                },
                {
                  label: 'On-time arrival',
                  value: `${(w.reliabilitySnapshot.onTimeRate * 100).toFixed(0)}%`,
                },
                {
                  label: 'Avg weekly income',
                  value: formatCurrency(
                    w.reliabilitySnapshot.averageWeeklyIncomeNaira,
                  ),
                },
                {
                  label: 'Income volatility',
                  value: `${(w.reliabilitySnapshot.incomeVolatilityPct * 100).toFixed(0)}%`,
                },
              ]}
            />
          </CardBody>
        </Card>
      </div>

      <Dialog open={showBlock} onOpenChange={setShowBlock}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block {w.fullName}?</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <p className="text-sm text-neutral-600">
              Blocking prevents this worker from seeing or applying to your future
              jobs. You can unblock anytime.
            </p>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-700">
                Reason (optional)
              </span>
              <Textarea
                rows={3}
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="No-showed twice in April."
              />
            </label>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowBlock(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={blockMutation.isPending}
              onClick={() => blockMutation.mutate(true)}
            >
              Block worker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
