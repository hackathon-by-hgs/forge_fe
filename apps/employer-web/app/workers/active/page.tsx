'use client';

import Link from 'next/link';
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DataTable,
  MapPlaceholder,
  PageHeader,
  RoutedTabs,
  StatusDot,
  type DataTableColumn,
} from '@forge/ui';
import { IconCamera, IconClock, IconLocation, IconShield } from '@forge/ui/icons';
import { formatRelativeTime } from '@forge/ui/utils';
import type { Job } from '@forge/types';
import { getActiveJobs, MOCK_WORKERS } from '@forge/mock-data';
import { workersTabs } from '../../../lib/nav';

interface ActiveAssignment {
  job: Job;
  worker: (typeof MOCK_WORKERS)[number];
}

export default function WorkersActivePage() {
  const inProgress = getActiveJobs().filter(
    (j) => j.status === 'in_progress' && j.assignedWorkerId,
  );
  const assignments: ActiveAssignment[] = inProgress.flatMap((j) => {
    const worker = MOCK_WORKERS.find((w) => w.id === j.assignedWorkerId);
    return worker ? [{ job: j, worker }] : [];
  });

  const pins = assignments.map(({ job }) => ({
    id: job.id,
    lat: job.location.lat,
    lng: job.location.lng,
    tone: 'warning' as const,
  }));

  const columns: DataTableColumn<ActiveAssignment>[] = [
    {
      key: 'name',
      header: 'Worker',
      sortBy: ({ worker }) => worker.fullName,
      cell: ({ worker }) => (
        <div className="flex items-center gap-2">
          <Avatar name={worker.fullName} size="sm" />
          <Link
            href={`/workers/${worker.id}`}
            className="text-sm font-medium text-neutral-900 hover:underline"
          >
            {worker.fullName}
          </Link>
        </div>
      ),
    },
    {
      key: 'job',
      header: 'Job',
      cell: ({ job }) => (
        <Link href={`/jobs/${job.id}`} className="text-sm hover:underline">
          {job.title}
        </Link>
      ),
    },
    {
      key: 'started',
      header: 'Started',
      sortBy: ({ job }) => job.startedAt ?? '',
      cell: ({ job }) =>
        job.startedAt ? (
          <span className="text-xs text-neutral-500">
            {formatRelativeTime(job.startedAt)}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'gps',
      header: 'GPS verified',
      cell: () => (
        <Badge tone="success" variant="soft">
          <IconShield className="!h-3 !w-3" /> Verified
        </Badge>
      ),
    },
    {
      key: 'photo',
      header: 'Photo proof',
      cell: () => (
        <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
          <IconCamera className="!h-3.5 !w-3.5" /> Pending
        </span>
      ),
    },
    {
      key: 'eta',
      header: 'Elapsed',
      cell: ({ job }) =>
        job.startedAt ? (
          <span
            className="inline-flex items-center gap-1 text-xs text-neutral-700 tabular-nums"
            data-numeric
          >
            <IconClock className="!h-3 !w-3" />
            {Math.max(
              0,
              Math.round((Date.now() - new Date(job.startedAt).getTime()) / 60000),
            )}
            m
          </span>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Workers"
        description="Live view of every worker on the clock right now."
      />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <RoutedTabs items={workersTabs} />
          <Badge tone="success" variant="soft">
            <StatusDot tone="success" pulse /> {assignments.length} active
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Live locations</CardTitle>
            <span className="text-xs text-neutral-500">
              <IconLocation className="!h-3 !w-3 -mt-0.5 mr-0.5 inline-block" />
              Lagos
            </span>
          </CardHeader>
          <CardBody>
            <MapPlaceholder pins={pins} className="aspect-[16/6]" />
          </CardBody>
        </Card>

        <DataTable
          data={assignments}
          columns={columns}
          rowKey={({ job }) => job.id}
          emptyTitle="No workers on the clock"
          emptyDescription="When workers start a job for you, they appear here."
          pagination={{ pageSizeOptions: [10, 25, 50, 100], itemLabel: 'worker' }}
        />
      </div>
    </>
  );
}
