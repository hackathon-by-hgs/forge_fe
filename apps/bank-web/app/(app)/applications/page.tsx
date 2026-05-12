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
import { toUserMessage } from '../../../lib/api/errors';
import { DECISION_LABEL, DECISION_TONE } from '../../../lib/loanUtils';

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

  const rows = listQuery.data?.data ?? [];
  const pagination = listQuery.data?.pagination;

  const columns: DataTableColumn<LoanApplicationDto>[] = [
    {
      key: 'applied',
      header: 'Applied',
      sortBy: (a) => a.appliedAt,
      cell: (a) => (
        <span className="text-xs text-neutral-500">
          {formatRelativeTime(a.appliedAt)}
        </span>
      ),
    },
    {
      key: 'borrower',
      header: 'Borrower',
      cell: (a) => (
        <div className="flex items-center gap-2">
          <Avatar
            name={a.borrower.displayName}
            src={a.borrower.photoUrl ?? undefined}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-900">
              {a.borrower.displayName}
            </p>
            <p className="text-[10px] text-neutral-500">
              {a.borrowerType === 'worker' ? 'Worker' : 'Business'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      align: 'right',
      sortBy: (a) => a.borrower.score,
      cellClassName: 'tabular-nums',
      cell: (a) => {
        const s = a.borrower.score;
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
      sortBy: (a) => a.amountRequestedNaira,
      cellClassName: 'tabular-nums font-medium',
      cell: (a) => formatCurrency(a.amountRequestedNaira),
    },
    {
      key: 'recommendation',
      header: 'Recommendation',
      cell: (a) => (
        <div className="flex items-center gap-2">
          <Badge tone={DECISION_TONE[a.recommendedDecision]}>
            {DECISION_LABEL[a.recommendedDecision]}
          </Badge>
          <span
            className="font-mono text-[10px] text-neutral-500 tabular-nums"
            data-numeric
          >
            {a.recommendationConfidencePct}%
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Why',
      cell: (a) => (
        <p className="line-clamp-1 max-w-xs text-xs text-neutral-600">
          {a.recommendationReason}
        </p>
      ),
    },
    {
      key: 'id',
      header: 'Ref',
      cellClassName: 'font-mono text-xs text-neutral-500',
      cell: (a) => a.id,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (a) => (
        <Link href={`/applications/${a.id}`}>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Open application"
            leadingIcon={<IconExternal className="!h-3.5 !w-3.5" />}
          >
            Open
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Loan Applications"
        description="Recommendations from the platform credit model. Decide, refer, or reject — every action is logged."
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusTabs value={status} onChange={setStatus} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Search by application id, borrower id, or name…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            className="max-w-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            aria-label="Recommendation"
            options={DECISION_OPTIONS}
            className="w-48"
            value={recommendedDecision}
            onChange={(e) =>
              setRecommendedDecision(e.target.value as typeof recommendedDecision)
            }
          />
          <Select
            aria-label="Borrower type"
            options={BORROWER_OPTIONS}
            className="w-44"
            value={borrowerType}
            onChange={(e) => setBorrowerType(e.target.value as typeof borrowerType)}
          />
        </div>

        {listQuery.isError ? (
          <AlertBanner
            tone="danger"
            title="Couldn’t load applications"
            description={toUserMessage(listQuery.error)}
            action={
              <Button size="sm" variant="secondary" onClick={() => void listQuery.refetch()}>
                Retry
              </Button>
            }
          />
        ) : listQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-outline bg-surface-container">
              <DataTable
                data={rows}
                columns={columns}
                rowKey={(a) => a.id}
                density="compact"
                emptyTitle="No applications match these filters"
                emptyDescription="Applications from borrowers will appear here as they come in."
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
                itemLabel="application"
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
