'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertBanner,
  Badge,
  Button,
  DataTable,
  Input,
  PageHeader,
  Pagination,
  RoutedTabs,
  Select,
  Skeleton,
  type DataTableColumn,
} from '@forge/ui';
import { IconAdd, IconSearch } from '@forge/ui/icons';
import { formatCurrency, formatRelativeTime, formatShortDate } from '@forge/ui/utils';
import { jobsTabs } from '../../lib/nav';
import {
  downloadJobsCsv,
  listJobs,
  type JobDto,
  type JobStatusWire,
  type JobTypeWire,
  type JobsListQuery,
  type JobsSortBy,
  type SortDir,
} from '../../lib/jobsApi';
import {
  JOB_STATUS_LABEL,
  JOB_STATUS_TONE,
  JOB_TYPE_LABEL,
} from '../../lib/jobUtils';

const STATUS_VALUES: JobStatusWire[] = [
  'draft',
  'open',
  'applications_in',
  'accepted',
  'in_progress',
  'pending_verification',
  'completed',
  'cancelled',
];

const TYPE_VALUES: JobTypeWire[] = ['loader', 'driver', 'unloader', 'general'];

export default function JobsListPage() {
  return (
    <Suspense fallback={<JobsListFallback />}>
      <JobsListInner />
    </Suspense>
  );
}

function JobsListFallback() {
  return (
    <>
      <PageHeader
        title="Jobs"
        description="Every job your team has posted, filtered any which way."
      />
      <div className="space-y-2 p-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </>
  );
}

function JobsListInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const query = useMemo<JobsListQuery>(() => {
    const statusRaw = sp.getAll('status');
    const status = statusRaw.length
      ? (statusRaw.flatMap((s) => s.split(',')).filter(Boolean) as JobStatusWire[])
      : undefined;
    const typeRaw = sp.get('type');
    const sortByRaw = sp.get('sortBy') as JobsSortBy | null;
    const sortDirRaw = sp.get('sortDir') as SortDir | null;
    const pageRaw = sp.get('page');
    const pageSizeRaw = sp.get('pageSize');

    return {
      status,
      type:
        typeRaw && TYPE_VALUES.includes(typeRaw as JobTypeWire)
          ? (typeRaw as JobTypeWire)
          : undefined,
      neighborhood: sp.get('neighborhood') || undefined,
      q: sp.get('q') || undefined,
      from: sp.get('from') || undefined,
      to: sp.get('to') || undefined,
      sortBy: sortByRaw ?? 'postedAt',
      sortDir: sortDirRaw ?? 'desc',
      page: pageRaw ? Math.max(1, Number(pageRaw)) : 1,
      pageSize: pageSizeRaw ? Math.min(100, Math.max(1, Number(pageSizeRaw))) : 25,
    };
  }, [sp]);

  const [searchInput, setSearchInput] = useState(query.q ?? '');
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  const jobsQuery = useQuery({
    queryKey: ['employer', 'jobs', 'list', query],
    queryFn: () => listJobs(query),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const update = (patch: Partial<JobsListQuery>) => {
    const next = new URLSearchParams(sp.toString());
    const merged: JobsListQuery = { ...query, ...patch, page: patch.page ?? 1 };
    [
      'status',
      'type',
      'neighborhood',
      'q',
      'from',
      'to',
      'sortBy',
      'sortDir',
      'page',
      'pageSize',
    ].forEach((k) => next.delete(k));
    if (merged.status?.length) for (const s of merged.status) next.append('status', s);
    if (merged.type) next.set('type', merged.type);
    if (merged.neighborhood) next.set('neighborhood', merged.neighborhood);
    if (merged.q) next.set('q', merged.q);
    if (merged.from) next.set('from', merged.from);
    if (merged.to) next.set('to', merged.to);
    if (merged.sortBy && merged.sortBy !== 'postedAt') next.set('sortBy', merged.sortBy);
    if (merged.sortDir && merged.sortDir !== 'desc') next.set('sortDir', merged.sortDir);
    if (merged.page && merged.page !== 1) next.set('page', String(merged.page));
    if (merged.pageSize && merged.pageSize !== 25)
      next.set('pageSize', String(merged.pageSize));
    const qs = next.toString();
    router.replace(qs ? `/jobs?${qs}` : '/jobs');
  };

  const columns: DataTableColumn<JobDto>[] = [
    {
      key: 'title',
      header: 'Job',
      cell: (j) => (
        <Link href={`/jobs/${j.id}`} className="font-medium text-neutral-900 hover:underline">
          {j.title}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (j) => (
        <Badge tone={JOB_STATUS_TONE[j.status]}>{JOB_STATUS_LABEL[j.status]}</Badge>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (j) => JOB_TYPE_LABEL[j.type],
    },
    {
      key: 'location',
      header: 'Location',
      cell: (j) => j.location.neighborhood ?? '—',
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
      header: 'Pay',
      align: 'right',
      cellClassName: 'tabular-nums',
      cell: (j) => formatCurrency(j.payNaira),
    },
    {
      key: 'scheduledStart',
      header: 'Starts',
      cell: (j) => formatShortDate(j.scheduledStartAt),
    },
    {
      key: 'posted',
      header: 'Posted',
      cell: (j) => (
        <span className="text-neutral-500">{formatRelativeTime(j.postedAt)}</span>
      ),
    },
    {
      key: 'apps',
      header: 'Apps',
      align: 'right',
      cellClassName: 'tabular-nums',
      cell: (j) => j.applicationsCount,
    },
  ];

  const handleCsv = async () => {
    setCsvLoading(true);
    setCsvError(null);
    try {
      await downloadJobsCsv({ ...query, page: undefined, pageSize: undefined });
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : 'CSV export failed');
    } finally {
      setCsvLoading(false);
    }
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update({ q: searchInput.trim() || undefined });
  };

  const data = jobsQuery.data?.data ?? [];
  const pagination = jobsQuery.data?.pagination;

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Every job your team has posted, filtered any which way."
        actions={
          <Link href="/jobs/new">
            <Button leadingIcon={<IconAdd className="!h-4 !w-4" />}>Post a job</Button>
          </Link>
        }
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
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

        <form onSubmit={onSearchSubmit} className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Search by title, neighborhood, or job ID…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            className="max-w-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Select
            aria-label="Filter by status"
            options={[
              { label: 'All statuses', value: 'all' },
              ...STATUS_VALUES.map((s) => ({ label: JOB_STATUS_LABEL[s], value: s })),
            ]}
            value={query.status?.[0] ?? 'all'}
            onChange={(e) => {
              const v = e.target.value;
              update({ status: v === 'all' ? undefined : [v as JobStatusWire] });
            }}
            className="w-44"
          />
          <Select
            aria-label="Filter by type"
            options={[
              { label: 'All types', value: 'all' },
              ...TYPE_VALUES.map((t) => ({ label: JOB_TYPE_LABEL[t], value: t })),
            ]}
            value={query.type ?? 'all'}
            onChange={(e) =>
              update({ type: e.target.value === 'all' ? undefined : (e.target.value as JobTypeWire) })
            }
            className="w-36"
          />
          <Input
            type="date"
            aria-label="From"
            value={query.from ?? ''}
            onChange={(e) => update({ from: e.target.value || undefined })}
            className="w-40"
          />
          <Input
            type="date"
            aria-label="To"
            value={query.to ?? ''}
            onChange={(e) => update({ to: e.target.value || undefined })}
            className="w-40"
          />
          <Select
            aria-label="Sort by"
            options={[
              { label: 'Posted', value: 'postedAt' },
              { label: 'Scheduled start', value: 'scheduledStartAt' },
              { label: 'Pay', value: 'payNaira' },
            ]}
            value={query.sortBy ?? 'postedAt'}
            onChange={(e) => update({ sortBy: e.target.value as JobsSortBy })}
            className="w-44"
          />
          <Select
            aria-label="Sort direction"
            options={[
              { label: 'Desc', value: 'desc' },
              { label: 'Asc', value: 'asc' },
            ]}
            value={query.sortDir ?? 'desc'}
            onChange={(e) => update({ sortDir: e.target.value as SortDir })}
            className="w-24"
          />
          <Button type="submit" variant="secondary" size="sm">
            Apply
          </Button>
        </form>

        {jobsQuery.isError ? (
          <AlertBanner
            tone="danger"
            title="Couldn’t load jobs"
            description={
              jobsQuery.error instanceof Error
                ? jobsQuery.error.message
                : 'Unknown error'
            }
            action={
              <Button size="sm" variant="secondary" onClick={() => void jobsQuery.refetch()}>
                Retry
              </Button>
            }
          />
        ) : jobsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-outline bg-surface-container">
              <DataTable
                data={data}
                columns={columns}
                rowKey={(j) => j.id}
                emptyTitle="No jobs match these filters"
                emptyDescription="Adjust filters or post a new job to get started."
              />
            </div>
            {pagination ? (
              <Pagination
                page={pagination.page}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onPageChange={(p) => update({ page: p })}
                pageSizeOptions={[10, 25, 50, 100]}
                onPageSizeChange={(ps) => update({ pageSize: ps, page: 1 })}
                itemLabel="job"
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
