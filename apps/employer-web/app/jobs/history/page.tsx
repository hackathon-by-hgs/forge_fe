'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertBanner,
  Badge,
  Button,
  DataTable,
  PageHeader,
  Pagination,
  RoutedTabs,
  Skeleton,
  type DataTableColumn,
} from '@forge/ui';
import { IconAdd } from '@forge/ui/icons';
import { formatCurrency, formatShortDate } from '@forge/ui/utils';
import { jobsTabs } from '../../../lib/nav';
import {
  downloadJobsCsv,
  listJobs,
  type JobDto,
  type JobsListQuery,
} from '../../../lib/jobsApi';
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from '../../../lib/jobUtils';

const PAST_FILTER: JobsListQuery['status'] = ['completed', 'cancelled'];

export default function JobsHistoryPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  const historyQuery = useQuery({
    queryKey: ['employer', 'jobs', 'list', { status: PAST_FILTER, page, pageSize }],
    queryFn: () =>
      listJobs({
        status: PAST_FILTER,
        page,
        pageSize,
        sortBy: 'postedAt',
        sortDir: 'desc',
      }),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const data = historyQuery.data?.data ?? [];
  const pagination = historyQuery.data?.pagination;

  const handleCsv = async () => {
    setCsvLoading(true);
    setCsvError(null);
    try {
      await downloadJobsCsv({ status: PAST_FILTER, sortBy: 'postedAt', sortDir: 'desc' });
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : 'CSV export failed');
    } finally {
      setCsvLoading(false);
    }
  };

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
      key: 'worker',
      header: 'Worker',
      cell: (j) =>
        j.assignedWorker ? (
          <span className="text-xs">{j.assignedWorker.fullName}</span>
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        ),
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
          <Button
            variant="secondary"
            size="sm"
            loading={csvLoading}
            onClick={() => void handleCsv()}
          >
            Export CSV
          </Button>
        </div>

        {csvError ? (
          <AlertBanner
            tone="danger"
            title="Export failed"
            description={csvError}
            onDismiss={() => setCsvError(null)}
          />
        ) : null}

        {historyQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : historyQuery.isError ? (
          <AlertBanner
            tone="danger"
            title="Couldn’t load history"
            description={
              historyQuery.error instanceof Error
                ? historyQuery.error.message
                : 'Unknown error'
            }
            action={
              <Button size="sm" variant="secondary" onClick={() => void historyQuery.refetch()}>
                Retry
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-outline bg-surface-container">
              <DataTable
                data={data}
                columns={columns}
                rowKey={(j) => j.id}
                emptyTitle="No past jobs"
                emptyDescription="Completed and cancelled jobs will appear here."
              />
            </div>
            {pagination ? (
              <Pagination
                page={pagination.page}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onPageChange={setPage}
                pageSizeOptions={[10, 25, 50, 100]}
                onPageSizeChange={(ps) => {
                  setPageSize(ps);
                  setPage(1);
                }}
                itemLabel="job"
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
