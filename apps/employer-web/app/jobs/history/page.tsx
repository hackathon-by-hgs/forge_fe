'use client';

import Link from 'next/link';
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  PageHeader,
  RoutedTabs,
  type DataTableColumn,
} from '@forge/ui';
import { IconAdd } from '@forge/ui/icons';
import { formatCurrency, formatShortDate } from '@forge/ui/utils';
import type { Job } from '@forge/types';
import { MOCK_JOBS, MOCK_WORKERS } from '@forge/mock-data';
import { jobsTabs } from '../../../lib/nav';
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from '../../../lib/jobUtils';

export default function JobsHistoryPage() {
  const past = MOCK_JOBS.filter(
    (j) => j.status === 'completed' || j.status === 'cancelled',
  );

  const columns: DataTableColumn<Job>[] = [
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
      key: 'worker',
      header: 'Worker',
      cell: (j) => {
        const w = j.assignedWorkerId
          ? MOCK_WORKERS.find((wk) => wk.id === j.assignedWorkerId)
          : null;
        return w ? (
          <div className="flex items-center gap-2">
            <Avatar name={w.fullName} size="sm" />
            <span className="text-xs">{w.fullName}</span>
          </div>
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        );
      },
    },
    {
      key: 'pay',
      header: 'Paid',
      align: 'right',
      sortBy: (j) => j.payNaira,
      cellClassName: 'tabular-nums',
      cell: (j) => formatCurrency(j.payNaira),
    },
    {
      key: 'completed',
      header: 'Date',
      sortBy: (j) => j.completedAt ?? j.postedAt,
      cell: (j) => formatShortDate(j.completedAt ?? j.postedAt),
    },
  ];

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Manage every job from posting through verification."
        actions={
          <Link href="/jobs/new">
            <Button leadingIcon={<IconAdd className="!h-4 !w-4" />}>Post a job</Button>
          </Link>
        }
      />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <RoutedTabs items={jobsTabs} />
          <Button variant="secondary" size="sm">
            Export CSV
          </Button>
        </div>
        <DataTable
          data={past}
          columns={columns}
          rowKey={(j) => j.id}
          emptyTitle="No past jobs"
          emptyDescription="Completed and cancelled jobs will appear here."
          pagination={{ pageSizeOptions: [10, 25, 50, 100], itemLabel: 'job' }}
        />
      </div>
    </>
  );
}
