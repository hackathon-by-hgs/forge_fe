'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { formatCurrency, formatRelativeTime } from '@forge/ui/utils';
import { jobsTabs } from '../../../lib/nav';
import { listJobs, publishJob, type JobDto } from '../../../lib/jobsApi';
import { ApiError } from '../../../lib/api';

export default function JobsDraftsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [publishError, setPublishError] = useState<string | null>(null);

  const draftsQuery = useQuery({
    queryKey: ['employer', 'jobs', 'list', { status: ['draft'], page, pageSize }],
    queryFn: () =>
      listJobs({ status: ['draft'], page, pageSize, sortBy: 'postedAt', sortDir: 'desc' }),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const publish = useMutation({
    mutationFn: (id: string) => publishJob(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employer', 'jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['employer', 'overview'] });
    },
    onError: (err) => {
      setPublishError(err instanceof ApiError ? err.message : 'Couldn’t publish draft');
    },
  });

  const drafts = draftsQuery.data?.data ?? [];
  const pagination = draftsQuery.data?.pagination;

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
      cell: (j) => j.location.neighborhood ?? '—',
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
          <Button
            size="sm"
            loading={publish.isPending && publish.variables === j.id}
            onClick={() => {
              setPublishError(null);
              publish.mutate(j.id);
            }}
          >
            Publish
          </Button>
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
          <Badge>{pagination?.total ?? 0} drafts</Badge>
        </div>

        {publishError ? (
          <AlertBanner
            tone="danger"
            title="Publish failed"
            description={publishError}
            onDismiss={() => setPublishError(null)}
          />
        ) : null}

        {draftsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : draftsQuery.isError ? (
          <AlertBanner
            tone="danger"
            title="Couldn’t load drafts"
            description={
              draftsQuery.error instanceof Error
                ? draftsQuery.error.message
                : 'Unknown error'
            }
            action={
              <Button size="sm" variant="secondary" onClick={() => void draftsQuery.refetch()}>
                Retry
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-outline bg-surface-container">
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
                itemLabel="draft"
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
