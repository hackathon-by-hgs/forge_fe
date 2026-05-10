'use client';

import {
  Badge,
  Button,
  DataTable,
  PageHeader,
  RoutedTabs,
  type DataTableColumn,
} from '@forge/ui';
import { IconAdd, IconReceipt } from '@forge/ui/icons';
import { formatCurrency, formatShortDate } from '@forge/ui/utils';
import { MOCK_TRANSACTIONS, MOCK_WORKERS, MOCK_JOBS } from '@forge/mock-data';
import { paymentsTabs } from '../../../lib/nav';

interface Invoice {
  id: string;
  date: string;
  workerName: string;
  jobTitle: string;
  amountNaira: number;
  status: 'draft' | 'sent' | 'paid';
}

export default function InvoicesPage() {
  // Synthesise invoices from completed transactions.
  const invoices: Invoice[] = MOCK_TRANSACTIONS.filter((t) => t.status === 'completed')
    .slice(0, 18)
    .map((t, i) => {
      const w = MOCK_WORKERS.find((wk) => wk.id === t.workerId);
      const j = MOCK_JOBS.find((jb) => jb.id === t.jobId);
      const status: Invoice['status'] = i % 4 === 0 ? 'draft' : i % 3 === 0 ? 'sent' : 'paid';
      return {
        id: `INV-${String(1000 + i).padStart(5, '0')}`,
        date: t.createdAt,
        workerName: w?.fullName ?? 'Worker',
        jobTitle: j?.title ?? 'Job',
        amountNaira: t.amountNaira,
        status,
      };
    });

  const columns: DataTableColumn<Invoice>[] = [
    {
      key: 'id',
      header: 'Invoice #',
      sortBy: (i) => i.id,
      cellClassName: 'font-mono text-xs',
      cell: (i) => i.id,
    },
    {
      key: 'date',
      header: 'Date',
      sortBy: (i) => i.date,
      cell: (i) => formatShortDate(i.date),
    },
    { key: 'worker', header: 'Worker', cell: (i) => i.workerName },
    { key: 'job', header: 'Job', cell: (i) => i.jobTitle },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortBy: (i) => i.amountNaira,
      cellClassName: 'tabular-nums font-medium',
      cell: (i) => formatCurrency(i.amountNaira),
    },
    {
      key: 'status',
      header: 'Status',
      sortBy: (i) => i.status,
      cell: (i) => (
        <Badge
          tone={
            i.status === 'paid' ? 'success' : i.status === 'sent' ? 'info' : 'neutral'
          }
        >
          {i.status[0]?.toUpperCase()}
          {i.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: () => (
        <Button variant="ghost" size="sm">
          Download PDF
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        description="Every naira out — pay outs, schedules, and invoices."
        actions={
          <Button leadingIcon={<IconAdd className="!h-4 !w-4" />}>
            Generate batch invoice
          </Button>
        }
      />

      <div className="space-y-4 p-6">
        <RoutedTabs items={paymentsTabs} />

        <DataTable
          data={invoices}
          columns={columns}
          rowKey={(i) => i.id}
          emptyTitle="No invoices yet"
          emptyDescription="Generate your first invoice from a completed job."
          emptyIcon={<IconReceipt className="!h-5 !w-5" />}
          pagination={{ pageSizeOptions: [10, 25, 50, 100], itemLabel: 'invoice' }}
        />
      </div>
    </>
  );
}
