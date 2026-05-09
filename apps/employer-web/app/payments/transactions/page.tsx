'use client';

import {
  Avatar,
  Badge,
  Button,
  DataTable,
  Input,
  MetricTile,
  PageHeader,
  RoutedTabs,
  Select,
  type DataTableColumn,
} from '@forge/ui';
import { IconFilter, IconSearch } from '@forge/ui/icons';
import { formatCurrency, formatRelativeTime, formatTransactionId } from '@forge/ui/utils';
import type { Transaction, TransactionStatus, StatusTone } from '@forge/types';
import { MOCK_TRANSACTIONS, MOCK_WORKERS, MOCK_JOBS } from '@forge/mock-data';
import { paymentsTabs } from '../../../lib/nav';

const STATUS_LABEL: Record<TransactionStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  reversed: 'Reversed',
};

const STATUS_TONE: Record<TransactionStatus, StatusTone> = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'danger',
  reversed: 'neutral',
};

export default function TransactionsPage() {
  const txns = MOCK_TRANSACTIONS;
  const totalThisMonth = txns
    .filter((t) => t.status === 'completed')
    .reduce((s, t) => s + t.amountNaira, 0);
  const pending = txns.filter((t) => t.status !== 'completed');
  const pendingTotal = pending.reduce((s, t) => s + t.amountNaira, 0);
  const avg = txns.length ? Math.round(totalThisMonth / txns.length) : 0;
  const max = txns.reduce((m, t) => Math.max(m, t.amountNaira), 0);

  const columns: DataTableColumn<Transaction>[] = [
    {
      key: 'date',
      header: 'Date',
      sortBy: (t) => t.createdAt,
      cell: (t) => (
        <span className="text-xs text-neutral-500">{formatRelativeTime(t.createdAt)}</span>
      ),
    },
    {
      key: 'worker',
      header: 'Worker',
      cell: (t) => {
        const w = MOCK_WORKERS.find((wk) => wk.id === t.workerId);
        return w ? (
          <div className="flex items-center gap-2">
            <Avatar name={w.fullName} size="sm" />
            <span className="text-sm">{w.fullName}</span>
          </div>
        ) : (
          '—'
        );
      },
    },
    {
      key: 'job',
      header: 'Job',
      cell: (t) => {
        const j = MOCK_JOBS.find((jb) => jb.id === t.jobId);
        return j ? <span className="text-sm">{j.title}</span> : '—';
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortBy: (t) => t.amountNaira,
      cellClassName: 'tabular-nums font-medium',
      cell: (t) => formatCurrency(t.amountNaira),
    },
    {
      key: 'status',
      header: 'Status',
      sortBy: (t) => t.status,
      cell: (t) => <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>,
    },
    {
      key: 'reference',
      header: 'Squad ref',
      cellClassName: 'font-mono text-xs text-neutral-500',
      cell: (t) => formatTransactionId(t.squadReference),
    },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        description="Every naira out — pay outs, schedules, and invoices."
        actions={<Button variant="secondary">Export CSV</Button>}
      />

      <div className="space-y-4 p-6">
        <RoutedTabs items={paymentsTabs} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Paid this month"
            value={formatCurrency(totalThisMonth, { compact: true })}
          />
          <MetricTile
            label="Pending"
            value={formatCurrency(pendingTotal, { compact: true })}
            hint={`${pending.length} transactions`}
          />
          <MetricTile label="Average job cost" value={formatCurrency(avg)} />
          <MetricTile label="Largest payment" value={formatCurrency(max)} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Search by worker, Squad ref, or job ID…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            className="max-w-sm"
          />
          <Select
            aria-label="Status"
            options={[
              { label: 'All statuses', value: 'all' },
              { label: 'Completed', value: 'completed' },
              { label: 'Pending', value: 'pending' },
              { label: 'Failed', value: 'failed' },
            ]}
            className="w-44"
            defaultValue="all"
          />
          <Select
            aria-label="Date"
            options={[
              { label: 'All time', value: 'all' },
              { label: 'Last 7 days', value: '7' },
              { label: 'Last 30 days', value: '30' },
            ]}
            className="w-44"
            defaultValue="30"
          />
          <Button variant="secondary" leadingIcon={<IconFilter className="!h-4 !w-4" />}>
            More filters
          </Button>
        </div>

        <DataTable
          data={txns}
          columns={columns}
          rowKey={(t) => t.id}
          emptyTitle="No transactions"
          emptyDescription="Payments to workers will appear here in real-time."
        />
      </div>
    </>
  );
}
