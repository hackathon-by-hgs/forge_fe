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
  StatusDot,
  type DataTableColumn,
} from '@forge/ui';
import { IconExternal, IconSearch } from '@forge/ui/icons';
import {
  formatCurrency,
  formatPercent,
  formatShortDate,
} from '@forge/ui/utils';
import {
  fetchLoans,
  type BankLoansListQuery,
  type BorrowerType,
  type LoanDto,
  type LoanRiskLevelWire,
  type LoanStatusWire,
} from '../../../lib/api/bankApi';
import { toUserMessage } from '../../../lib/api/errors';
import {
  RISK_LABEL,
  RISK_TONE,
  STATUS_LABEL,
  STATUS_TONE,
} from '../../../lib/loanUtils';

const STATUS_OPTIONS: { label: string; value: 'all' | LoanStatusWire }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending', value: 'pending_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Active', value: 'active' },
  { label: 'At risk', value: 'at_risk' },
  { label: 'Repaid', value: 'repaid' },
  { label: 'Defaulted', value: 'defaulted' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Written off', value: 'written_off' },
];

const RISK_OPTIONS: { label: string; value: 'all' | LoanRiskLevelWire }[] = [
  { label: 'All risk levels', value: 'all' },
  { label: 'Critical (red)', value: 'red' },
  { label: 'Watch (yellow)', value: 'yellow' },
  { label: 'Healthy (green)', value: 'green' },
];

const BORROWER_OPTIONS: { label: string; value: 'all' | BorrowerType }[] = [
  { label: 'All borrowers', value: 'all' },
  { label: 'Workers', value: 'worker' },
  { label: 'Businesses', value: 'business' },
];

export default function ActiveLoansPage() {
  const [riskLevel, setRiskLevel] = useState<'all' | LoanRiskLevelWire>('all');
  const [status, setStatus] = useState<'all' | LoanStatusWire>('all');
  const [borrowerType, setBorrowerType] = useState<'all' | BorrowerType>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Reset only on pageSize change — filter changes preserve pagination.
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const query: BankLoansListQuery = useMemo(
    () => ({
      riskLevel: riskLevel === 'all' ? undefined : riskLevel,
      status: status === 'all' ? undefined : status,
      borrowerType: borrowerType === 'all' ? undefined : borrowerType,
      q: debouncedSearch || undefined,
      page,
      pageSize,
    }),
    [riskLevel, status, borrowerType, debouncedSearch, page, pageSize],
  );

  const listQuery = useQuery({
    queryKey: ['bank', 'loans', query],
    queryFn: () => fetchLoans(query),
    retry: false,
    placeholderData: (prev) => prev,
    refetchInterval: 30_000,
  });

  const rows = listQuery.data?.data ?? [];
  const pagination = listQuery.data?.pagination;

  const columns: DataTableColumn<LoanDto>[] = [
    {
      key: 'risk',
      header: '',
      width: '32px',
      cell: (l) => (
        <StatusDot tone={RISK_TONE[l.riskLevel]} pulse={l.riskLevel === 'red'} />
      ),
    },
    {
      key: 'id',
      header: 'Loan',
      cellClassName: 'font-mono text-xs',
      cell: (l) => l.id,
    },
    {
      key: 'borrower',
      header: 'Borrower',
      cell: (l) => (
        <div className="flex items-center gap-2">
          <Avatar
            name={l.borrower.displayName}
            src={l.borrower.photoUrl ?? undefined}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-900">
              {l.borrower.displayName}
            </p>
            <p className="text-[10px] text-neutral-500">
              {l.borrowerType === 'worker' ? 'Worker' : 'Business'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'principal',
      header: 'Principal',
      align: 'right',
      sortBy: (l) => l.principalNaira,
      cellClassName: 'tabular-nums text-neutral-600',
      cell: (l) => formatCurrency(l.principalNaira, { compact: true }),
    },
    {
      key: 'outstanding',
      header: 'Outstanding',
      align: 'right',
      sortBy: (l) => l.outstandingNaira,
      cellClassName: 'tabular-nums font-medium',
      cell: (l) => formatCurrency(l.outstandingNaira),
    },
    {
      key: 'apr',
      header: 'APR',
      align: 'right',
      sortBy: (l) => l.apr,
      cellClassName: 'tabular-nums text-xs text-neutral-600',
      cell: (l) => formatPercent(l.apr),
    },
    {
      key: 'term',
      header: 'Term',
      align: 'right',
      cellClassName: 'tabular-nums text-xs text-neutral-600',
      cell: (l) => (l.termMonths ? `${l.termMonths}m` : '—'),
    },
    {
      key: 'next',
      header: 'Next due',
      cellClassName: 'text-xs text-neutral-600',
      cell: (l) =>
        l.nextPaymentDueAt ? formatShortDate(l.nextPaymentDueAt) : '—',
    },
    {
      key: 'risk-badge',
      header: 'Risk',
      sortBy: (l) => l.riskLevel,
      cell: (l) => <Badge tone={RISK_TONE[l.riskLevel]}>{RISK_LABEL[l.riskLevel]}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      sortBy: (l) => l.status,
      cell: (l) => (
        <Badge tone={STATUS_TONE[l.status]} variant="soft">
          {STATUS_LABEL[l.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (l) => (
        <Link href={`/loans/${l.id}`}>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Open loan"
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
        title="Active Loans"
        description="Live portfolio. Drill into any loan, escalate the ones that need attention."
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Search by loan id, borrower id, or name…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            className="max-w-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            aria-label="Risk"
            options={RISK_OPTIONS}
            className="w-48"
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value as typeof riskLevel)}
          />
          <Select
            aria-label="Status"
            options={STATUS_OPTIONS}
            className="w-44"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
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
            title="Couldn’t load loans"
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
                rowKey={(l) => l.id}
                density="compact"
                emptyTitle="No loans match these filters"
                emptyDescription="Adjust filters or wait for new disbursements to flow in."
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
                itemLabel="loan"
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
