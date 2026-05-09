'use client';

import { addDays, format, formatISO } from 'date-fns';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DataTable,
  PageHeader,
  RoutedTabs,
  type DataTableColumn,
} from '@forge/ui';
import { IconCalendar } from '@forge/ui/icons';
import { formatAbsoluteDate, formatCurrency } from '@forge/ui/utils';
import { paymentsTabs } from '../../../lib/nav';

interface Payout {
  id: string;
  scheduledFor: string;
  amountNaira: number;
  status: 'scheduled' | 'processing' | 'paid';
  description: string;
}

const upcoming: Payout[] = Array.from({ length: 6 }, (_, i) => ({
  id: `payout_${i}`,
  scheduledFor: formatISO(addDays(new Date(), i * 3)),
  amountNaira: 47_500 + i * 12_500,
  status: i === 0 ? 'processing' : 'scheduled',
  description: 'Weekly auto-debit to Squad wallet',
}));

const past: Payout[] = Array.from({ length: 6 }, (_, i) => ({
  id: `payout_past_${i}`,
  scheduledFor: formatISO(addDays(new Date(), -((i + 1) * 7))),
  amountNaira: 38_000 + ((i * 7) % 25_000),
  status: 'paid',
  description: 'Weekly auto-debit',
}));

export default function PayoutsPage() {
  const next = upcoming[0];

  const columns: DataTableColumn<Payout>[] = [
    {
      key: 'date',
      header: 'Date',
      sortBy: (p) => p.scheduledFor,
      cell: (p) => formatAbsoluteDate(p.scheduledFor),
    },
    { key: 'desc', header: 'Description', cell: (p) => p.description },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortBy: (p) => p.amountNaira,
      cellClassName: 'tabular-nums font-medium',
      cell: (p) => formatCurrency(p.amountNaira),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => (
        <Badge
          tone={
            p.status === 'paid' ? 'success' : p.status === 'processing' ? 'info' : 'neutral'
          }
        >
          {p.status}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        description="Every naira out — pay outs, schedules, and invoices."
      />

      <div className="space-y-4 p-6">
        <RoutedTabs items={paymentsTabs} />

        <Card>
          <CardBody className="flex items-center gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
              <IconCalendar className="!h-6 !w-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-neutral-500">Next payout</p>
              <p
                className="text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {next ? formatCurrency(next.amountNaira) : '—'}
              </p>
              <p className="text-xs text-neutral-500">
                {next ? formatAbsoluteDate(next.scheduledFor) : ''}
              </p>
            </div>
            <Button variant="secondary">Pause auto-debits</Button>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
              <Badge>{upcoming.length}</Badge>
            </CardHeader>
            <CardBody>
              <ul className="divide-y divide-neutral-100">
                {upcoming.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {format(new Date(p.scheduledFor), 'EEE, d MMM')}
                      </p>
                      <p className="text-xs text-neutral-500">{p.description}</p>
                    </div>
                    <span
                      className="text-sm font-medium text-neutral-900 tabular-nums"
                      data-numeric
                    >
                      {formatCurrency(p.amountNaira)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardBody>
              <DataTable
                data={past}
                columns={columns}
                rowKey={(p) => p.id}
                density="compact"
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
