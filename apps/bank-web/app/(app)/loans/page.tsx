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
  StatusDot,
  type DataTableColumn,
} from '@forge/ui';
import {
  IconExternal,
  IconFilter,
  IconSearch,
} from '@forge/ui/icons';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatShortDate,
} from '@forge/ui/utils';
import type { Loan } from '@forge/types';
import { MOCK_EMPLOYERS, MOCK_LOANS, MOCK_WORKERS } from '@forge/mock-data';
import {
  RISK_LABEL,
  RISK_TONE,
  STATUS_LABEL,
  STATUS_TONE,
} from '../../../lib/loanUtils';

function resolveBorrower(loan: Loan) {
  if (loan.borrowerType === 'worker') {
    const w = MOCK_WORKERS.find((wk) => wk.id === loan.borrowerId);
    return w
      ? { name: w.fullName, kind: 'Worker' as const }
      : { name: loan.borrowerId, kind: 'Worker' as const };
  }
  const b = MOCK_EMPLOYERS.find((bz) => bz.id === loan.borrowerId);
  return b
    ? { name: b.businessName, kind: 'Business' as const }
    : { name: loan.borrowerId, kind: 'Business' as const };
}

export default function ActiveLoansPage() {
  const all = MOCK_LOANS;
  const live = all.filter(
    (l) => l.status === 'active' || l.status === 'at_risk',
  );
  const totalOutstanding = live.reduce((s, l) => s + l.outstandingNaira, 0);
  const totalPrincipal = live.reduce((s, l) => s + l.principalNaira, 0);
  const onSchedule = live.filter((l) => l.riskLevel === 'green').length;
  const atRisk = all.filter((l) => l.riskLevel !== 'green');
  const avgApr = live.length
    ? live.reduce((s, l) => s + l.apr, 0) / live.length
    : 0;

  const columns: DataTableColumn<Loan>[] = [
    {
      key: 'risk',
      header: '',
      width: '32px',
      cell: (l) => <StatusDot tone={RISK_TONE[l.riskLevel]} pulse={l.riskLevel === 'red'} />,
    },
    {
      key: 'id',
      header: 'Loan',
      sortBy: (l) => l.id,
      cellClassName: 'font-mono text-xs',
      cell: (l) => l.id,
    },
    {
      key: 'borrower',
      header: 'Borrower',
      sortBy: (l) => resolveBorrower(l).name,
      cell: (l) => {
        const b = resolveBorrower(l);
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
      sortBy: (l) => l.termMonths,
      cellClassName: 'tabular-nums text-xs text-neutral-600',
      cell: (l) => `${l.termMonths}m`,
    },
    {
      key: 'next',
      header: 'Next due',
      sortBy: (l) => l.nextPaymentDueAt ?? '',
      cellClassName: 'text-xs text-neutral-600',
      cell: (l) => (l.nextPaymentDueAt ? formatShortDate(l.nextPaymentDueAt) : '—'),
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
      key: 'score',
      header: 'Approval score',
      align: 'right',
      sortBy: (l) => l.scoreAtApproval,
      cellClassName: 'tabular-nums text-xs text-neutral-600',
      cell: (l) => l.scoreAtApproval,
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
        description="Live portfolio. Sort by risk, drill into any loan, escalate the ones that need attention."
        actions={<Button variant="secondary">Export portfolio</Button>}
      />

      <div className="space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Live loans"
            value={formatNumber(live.length)}
            hint={`${formatCurrency(totalPrincipal, { compact: true })} principal`}
          />
          <MetricTile
            label="Outstanding"
            value={formatCurrency(totalOutstanding, { compact: true })}
            delta={{ pct: 2.1, direction: 'up', label: 'vs last week' }}
          />
          <MetricTile
            label="On schedule"
            value={`${live.length ? Math.round((onSchedule / live.length) * 100) : 0}%`}
            hint={`${onSchedule} of ${live.length}`}
          />
          <MetricTile
            label="At risk"
            value={formatNumber(atRisk.length)}
            hint={`Avg APR ${(avgApr * 100).toFixed(1)}%`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Search by loan ref, borrower, or amount…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            className="max-w-sm"
          />
          <Select
            aria-label="Risk"
            options={[
              { label: 'All risk levels', value: 'all' },
              { label: 'Critical (red)', value: 'red' },
              { label: 'Watch (yellow)', value: 'yellow' },
              { label: 'Healthy (green)', value: 'green' },
            ]}
            className="w-48"
            defaultValue="all"
          />
          <Select
            aria-label="Status"
            options={[
              { label: 'All statuses', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'At risk', value: 'at_risk' },
              { label: 'Repaid', value: 'repaid' },
              { label: 'Defaulted', value: 'defaulted' },
            ]}
            className="w-44"
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
          <Button variant="secondary" leadingIcon={<IconFilter className="!h-4 !w-4" />}>
            More filters
          </Button>
        </div>

        <DataTable
          data={all}
          columns={columns}
          rowKey={(l) => l.id}
          density="compact"
          emptyTitle="No loans"
          emptyDescription="Approved applications will appear here once disbursed."
          pagination={{ pageSizeOptions: [10, 25, 50, 100], itemLabel: 'loan' }}
        />
      </div>
    </>
  );
}
