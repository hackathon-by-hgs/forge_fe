'use client';

import Link from 'next/link';
import {
  Badge,
  Button,
  DataTable,
  PageHeader,
  RoutedTabs,
  type DataTableColumn,
} from '@forge/ui';
import { IconAdd } from '@forge/ui/icons';
import { formatCurrency, formatRelativeTime } from '@forge/ui/utils';
import type { Job } from '@forge/types';
import { MOCK_JOBS } from '@forge/mock-data';
import { jobsTabs } from '../../../lib/nav';

export default function JobsDraftsPage() {
  const drafts = MOCK_JOBS.filter((j) => j.status === 'draft');

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
      sortBy: (j) => j.location.neighborhood,
      cell: (j) => j.location.neighborhood,
    },
    {
      key: 'last_edit',
      header: 'Last edit',
      sortBy: (j) => j.postedAt,
      cell: (j) => (
        <span className="text-neutral-500">{formatRelativeTime(j.postedAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (j) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/jobs/${j.id}`}>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </Link>
          <Button size="sm">Publish</Button>
        </div>
      ),
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
          <Badge>{drafts.length} drafts</Badge>
        </div>
        <DataTable
          data={drafts}
          columns={columns}
          rowKey={(j) => j.id}
          emptyTitle="No drafts"
          emptyDescription="Save a job as a draft and it will appear here."
          emptyAction={
            <Link href="/jobs/new">
              <Button>Start a draft</Button>
            </Link>
          }
          pagination={{ pageSizeOptions: [10, 25, 50, 100], itemLabel: 'draft' }}
        />
      </div>
    </>
  );
}
