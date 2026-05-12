'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertBanner,
  Avatar,
  Badge,
  Button,
  DataTable,
  Input,
  PageHeader,
  Pagination,
  Select,
  Skeleton,
  type DataTableColumn,
} from '@forge/ui';
import { IconExternal, IconSearch } from '@forge/ui/icons';
import { formatCurrency, formatRelativeTime } from '@forge/ui/utils';
import {
  fetchApplications,
  type BankApplicationsListQuery,
  type BorrowerType,
  type LoanApplicationDto,
  type LoanApplicationStatusWire,
  type RecommendedDecisionWire,
} from '../../../lib/api/bankApi';
import { NetworkError, toUserMessage } from '../../../lib/api/errors';
import { safeDecisionLabel, safeDecisionTone } from '../../../lib/loanUtils';

const STATUS_TABS: { label: string; status: LoanApplicationStatusWire }[] = [
  { label: 'Pending', status: 'pending' },
  { label: 'Approved', status: 'approved' },
  { label: 'Rejected', status: 'rejected' },
];

const BORROWER_OPTIONS: { label: string; value: 'all' | BorrowerType }[] = [
  { label: 'All borrowers', value: 'all' },
  { label: 'Workers', value: 'worker' },
  { label: 'Businesses', value: 'business' },
];

const DECISION_OPTIONS: { label: string; value: 'all' | RecommendedDecisionWire }[] = [
  { label: 'All recommendations', value: 'all' },
  { label: 'Approve', value: 'approve' },
  { label: 'With conditions', value: 'approve_with_conditions' },
  { label: 'Reject', value: 'reject' },
];

function StatusTabs({
  value,
  onChange,
}: {
  value: LoanApplicationStatusWire;
  onChange: (next: LoanApplicationStatusWire) => void;
}) {
  return (
    <div className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-200 bg-white p-0.5">
      {STATUS_TABS.map((t) => (
        <button
          key={t.status}
          type="button"
          onClick={() => onChange(t.status)}
          className={`inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors ${
            value === t.status
              ? 'bg-neutral-100 text-neutral-900'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function formatAppliedAt(iso: string | undefined): string {
  if (!iso?.trim()) return '—';
  try {
    return formatRelativeTime(iso);
  } catch {
    return '—';
  }
}

export default function LoanApplicationsPage() {
  const [status, setStatus] = useState<LoanApplicationStatusWire>('pending');
  const [borrowerType, setBorrowerType] = useState<'all' | BorrowerType>('all');
  const [recommendedDecision, setRecommendedDecision] = useState<
    'all' | RecommendedDecisionWire
  >('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [status, borrowerType, recommendedDecision, debouncedSearch, pageSize]);

  const query: BankApplicationsListQuery = useMemo(
    () => ({
      status,
      borrowerType: borrowerType === 'all' ? undefined : borrowerType,
      recommendedDecision:
        recommendedDecision === 'all' ? undefined : recommendedDecision,
      q: debouncedSearch || undefined,
      page,
      pageSize,
    }),
    [status, borrowerType, recommendedDecision, debouncedSearch, page, pageSize],
  );

  const listQuery = useQuery({
    queryKey: ['bank', 'applications', query],
    queryFn: () => fetchApplications(query),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const pagination = listQuery.data?.pagination;
  const rows = listQuery.data?.data ?? [];

  useEffect(() => {
    if (!listQuery.isSuccess || !pagination?.totalPages) return;
    const maxPage = Math.max(1, pagination.totalPages);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [listQuery.isSuccess, pagination?.totalPages, page]);

  const isInitialLoading = listQuery.isPending && !listQuery.data;
  const isRefreshing =
    Boolean(listQuery.data) && listQuery.isFetching && !listQuery.isPending;

  const columns: DataTableColumn<LoanApplicationDto>[] = useMemo(
    () => [
      {
        key: 'applied',
        header: 'Applied',
        sortBy: (a) => a?.appliedAt ?? '',
        cell: (a) => (
          <span className="text-xs text-neutral-500">
            {formatAppliedAt(a?.appliedAt)}
          </span>
        ),
      },
      {
        key: 'borrower',
        header: 'Borrower',
        cell: (a) => (
          <div className="flex items-center gap-2">
            <Avatar
              name={a?.borrower?.displayName ?? '—'}
              src={a?.borrower?.photoUrl ?? undefined}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">
                {a?.borrower?.displayName ?? '—'}
              </p>
              <p className="text-[10px] text-neutral-500">
                {a?.borrowerType === 'business' ? 'Business' : 'Worker'}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'score',
        header: 'Score',
        align: 'right',
        sortBy: (a) => a?.borrower?.score ?? 0,
        cellClassName: 'tabular-nums',
        cell: (a) => {
          const s = a?.borrower?.score ?? 0;
          const tone =
            s >= 80
              ? 'text-success-700'
              : s >= 65
                ? 'text-warning-700'
                : 'text-danger-700';
          return <span className={`font-medium ${tone}`}>{s}</span>;
        },
      },
      {
        key: 'amount',
        header: 'Amount',
        align: 'right',
        sortBy: (a) => a?.amountRequestedNaira ?? 0,
        cellClassName: 'tabular-nums font-medium',
        cell: (a) => formatCurrency(a?.amountRequestedNaira ?? 0),
      },
      {
        key: 'recommendation',
        header: 'Recommendation',
        cell: (a) => (
          <div className="flex items-center gap-2">
            <Badge tone={safeDecisionTone(a?.recommendedDecision)}>
              {safeDecisionLabel(a?.recommendedDecision)}
            </Badge>
            <span
              className="font-mono text-[10px] text-neutral-500 tabular-nums"
              data-numeric
            >
              {a?.recommendationConfidencePct ?? 0}%
            </span>
          </div>
        ),
      },
      {
        key: 'reason',
        header: 'Why',
        cell: (a) => (
          <p className="line-clamp-1 max-w-xs text-xs text-neutral-600">
            {a?.recommendationReason?.trim() ? a.recommendationReason : '—'}
          </p>
        ),
      },
      {
        key: 'id',
        header: 'Ref',
        cellClassName: 'font-mono text-xs text-neutral-500',
        cell: (a) => a?.id ?? '—',
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        cell: (a) => {
          const id = a?.id;
          if (!id) return null;
          return (
            <Link href={`/applications/${encodeURIComponent(id)}`}>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Open application"
                leadingIcon={<IconExternal className="!h-3.5 !w-3.5" />}
              >
                Open
              </Button>
            </Link>
          );
        },
      },
    ],
    [],
  );

  const listError = listQuery.error;
  const isOffline = listError instanceof NetworkError;

  return (
    <>
      <PageHeader
        title="Loan Applications"
        description="Recommendations from the platform credit model. Decide, refer, or reject — every action is logged."
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusTabs value={status} onChange={setStatus} />
          {listQuery.isSuccess ? (
            <p className="text-xs text-neutral-500 tabular-nums" data-numeric>
              {pagination?.total != null
                ? `${pagination.total} application${pagination.total === 1 ? '' : 's'} match`
                : null}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Search by application id, borrower id, or name…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            className="max-w-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={listQuery.isError}
          />
          <Select
            aria-label="Recommendation"
            options={DECISION_OPTIONS}
            className="w-48"
            value={recommendedDecision}
            onChange={(e) =>
              setRecommendedDecision(e.target.value as typeof recommendedDecision)
            }
            disabled={listQuery.isError}
          />
          <Select
            aria-label="Borrower type"
            options={BORROWER_OPTIONS}
            className="w-44"
            value={borrowerType}
            onChange={(e) => setBorrowerType(e.target.value as typeof borrowerType)}
            disabled={listQuery.isError}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-neutral-600"
            onClick={() => {
              setSearch('');
              setDebouncedSearch('');
              setBorrowerType('all');
              setRecommendedDecision('all');
              setStatus('pending');
              setPage(1);
              setPageSize(25);
            }}
            disabled={listQuery.isError}
          >
            Reset filters
          </Button>
        </div>

        {isRefreshing ? (
          <p className="text-sm text-neutral-500" role="status" aria-live="polite">
            Refreshing applications…
          </p>
        ) : null}

        {listQuery.isError ? (
          <AlertBanner
            tone="danger"
            title={isOffline ? 'Cannot reach the server' : 'Couldn’t load applications'}
            description={
              isOffline
                ? 'Check your connection and try again. If the problem continues, the Forge API may be unreachable.'
                : toUserMessage(listError)
            }
            action={
              <Button
                size="sm"
                variant="secondary"
                loading={listQuery.isFetching}
                onClick={() => void listQuery.refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : isInitialLoading ? (
          <>
            <p className="sr-only" role="status">
              Loading loan applications.
            </p>
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-outline bg-surface-container">
              <DataTable
                data={rows}
                columns={columns}
                rowKey={(a) => a?.id ?? ''}
                density="compact"
                emptyTitle="No applications match these filters"
                emptyDescription="Applications from borrowers will appear here as they come in."
              />
            </div>
            {pagination ? (
              <Pagination
                page={page}
                pageSize={pagination?.pageSize ?? pageSize}
                total={pagination?.total ?? 0}
                onPageChange={setPage}
                pageSizeOptions={[10, 25, 50, 100]}
                onPageSizeChange={(ps) => {
                  setPageSize(ps);
                  setPage(1);
                }}
                itemLabel="application"
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
