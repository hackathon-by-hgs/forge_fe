'use client';

import Link from 'next/link';
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  Input,
  MetricTile,
  PageHeader,
  Select,
  type DataTableColumn,
} from '@forge/ui';
import {
  IconCheck,
  IconClose,
  IconExternal,
  IconFilter,
  IconSearch,
} from '@forge/ui/icons';
import {
  formatCurrency,
  formatNumber,
  formatRelativeTime,
} from '@forge/ui/utils';
import type { LoanApplication } from '@forge/types';
import {
  MOCK_EMPLOYERS,
  MOCK_LOAN_APPLICATIONS,
  MOCK_WORKERS,
} from '@forge/mock-data';
import { DECISION_LABEL, DECISION_TONE } from '../../../lib/loanUtils';

function resolveBorrower(app: LoanApplication) {
  if (app.borrowerType === 'worker') {
    const w = MOCK_WORKERS.find((wk) => wk.id === app.borrowerId);
    return w
      ? { name: w.fullName, score: w.reliabilityScore, kind: 'Worker' as const }
      : { name: app.borrowerId, score: null, kind: 'Worker' as const };
  }
  const b = MOCK_EMPLOYERS.find((bz) => bz.id === app.borrowerId);
  return b
    ? { name: b.businessName, score: b.creditScore, kind: 'Business' as const }
    : { name: app.borrowerId, score: null, kind: 'Business' as const };
}

export default function LoanApplicationsPage() {
  const apps = MOCK_LOAN_APPLICATIONS;
  const newToday = apps.filter(
    (a) => Date.now() - new Date(a.appliedAt).getTime() < 24 * 60 * 60 * 1000,
  );
  const recApprove = apps.filter((a) => a.recommendedDecision === 'approve');
  const recConditions = apps.filter(
    (a) => a.recommendedDecision === 'approve_with_conditions',
  );
  const recReject = apps.filter((a) => a.recommendedDecision === 'reject');
  const totalRequested = apps.reduce((s, a) => s + a.amountRequestedNaira, 0);
  const avgConfidence = apps.length
    ? apps.reduce((s, a) => s + a.recommendationConfidencePct, 0) / apps.length
    : 0;

  const columns: DataTableColumn<LoanApplication>[] = [
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
      sortBy: (a) => resolveBorrower(a).name,
      cell: (a) => {
        const b = resolveBorrower(a);
        return (
          <div className="flex items-center gap-2">
            <Avatar name={b.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">
                {b.name}
              </p>
              <p className="text-[10px] text-neutral-500">{b.kind}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'score',
      header: 'Score',
      align: 'right',
      sortBy: (a) => resolveBorrower(a).score ?? 0,
      cellClassName: 'tabular-nums',
      cell: (a) => {
        const s = resolveBorrower(a).score;
        if (s == null) return <span className="text-neutral-400">—</span>;
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
      sortBy: (a) => a.recommendedDecision,
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
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            leadingIcon={<IconCheck className="!h-3.5 !w-3.5" />}
            aria-label="Approve"
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            leadingIcon={<IconClose className="!h-3.5 !w-3.5" />}
            aria-label="Reject"
          >
            Reject
          </Button>
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
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Loan Applications"
        description="Recommendations from the platform credit model. Decide, refer, or reject — every action is logged."
        actions={<Button variant="secondary">Export queue</Button>}
      />

      <div className="space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="In queue"
            value={formatNumber(apps.length)}
            hint={`${newToday.length} new in last 24h`}
          />
          <MetricTile
            label="Total requested"
            value={formatCurrency(totalRequested, { compact: true })}
          />
          <MetricTile
            label="Recommended approve"
            value={formatNumber(recApprove.length)}
            hint={`+${recConditions.length} with conditions · ${recReject.length} reject`}
          />
          <MetricTile
            label="Avg model confidence"
            value={`${avgConfidence.toFixed(1)}%`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Search by borrower, ref, or amount…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            className="max-w-sm"
          />
          <Select
            aria-label="Recommendation"
            options={[
              { label: 'All recommendations', value: 'all' },
              { label: 'Approve', value: 'approve' },
              { label: 'With conditions', value: 'approve_with_conditions' },
              { label: 'Reject', value: 'reject' },
            ]}
            className="w-48"
            defaultValue="all"
          />
          <Select
            aria-label="Borrower type"
            options={[
              { label: 'All borrowers', value: 'all' },
              { label: 'Workers', value: 'worker' },
              { label: 'Businesses', value: 'business' },
            ]}
            className="w-44"
            defaultValue="all"
          />
          <Select
            aria-label="Sort"
            options={[
              { label: 'Newest first', value: 'new' },
              { label: 'Highest amount', value: 'amount' },
              { label: 'Highest confidence', value: 'confidence' },
            ]}
            className="w-44"
            defaultValue="new"
          />
          <Button variant="secondary" leadingIcon={<IconFilter className="!h-4 !w-4" />}>
            More filters
          </Button>
        </div>

        <DataTable
          data={apps}
          columns={columns}
          rowKey={(a) => a.id}
          density="compact"
          emptyTitle="No applications in queue"
          emptyDescription="New applications from the platform will appear here in real-time."
          pagination={{ pageSizeOptions: [10, 25, 50, 100], itemLabel: 'application' }}
        />
      </div>
    </>
  );
}
