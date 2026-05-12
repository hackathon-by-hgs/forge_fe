'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DataTable,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  PageHeader,
  Pagination,
  RoutedTabs,
  Skeleton,
  Textarea,
  type DataTableColumn,
} from '@forge/ui';
import { IconCalendar } from '@forge/ui/icons';
import { formatAbsoluteDate, formatCurrency } from '@forge/ui/utils';
import { paymentsTabs } from '../../../lib/nav';
import { useAuth } from '../../../lib/auth';
import { isHiringManager } from '../../../lib/roles';
import {
  PAYOUT_STATUS_LABEL,
  PAYOUT_STATUS_TONE,
  getPayoutsHistory,
  getUpcomingPayouts,
  pausePayouts,
  resumePayouts,
  topUpPayouts,
  type PayoutDto,
  type PayoutsUpcomingResponse,
  type TopUpInput,
} from '../../../lib/paymentsApi';
import { ApiError } from '../../../lib/api';

export default function PayoutsPage() {
  const role = useAuth((s) => s.user?.role);
  const canMutate = !isHiringManager(role);
  const queryClient = useQueryClient();

  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(25);
  const [showTopUp, setShowTopUp] = useState(false);
  const [pauseError, setPauseError] = useState<string | null>(null);

  const upcoming = useQuery({
    queryKey: ['employer', 'payouts', 'upcoming'],
    queryFn: getUpcomingPayouts,
    retry: false,
  });

  const history = useQuery({
    queryKey: ['employer', 'payouts', 'history', historyPage, historyPageSize],
    queryFn: () => getPayoutsHistory(historyPage, historyPageSize),
    retry: false,
    placeholderData: (prev) => prev,
  });

  // `paused` is embedded on the upcoming response (BE punch-list reply §1)
  // — no separate settings call needed.
  const paused = upcoming.data?.paused ?? false;

  const pauseMutation = useMutation({
    mutationFn: (next: boolean) => (next ? pausePayouts() : resumePayouts()),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ['employer', 'payouts', 'upcoming'] });
      const prev = queryClient.getQueryData<PayoutsUpcomingResponse>([
        'employer',
        'payouts',
        'upcoming',
      ]);
      if (prev) {
        queryClient.setQueryData<PayoutsUpcomingResponse>(
          ['employer', 'payouts', 'upcoming'],
          { ...prev, paused: next },
        );
      }
      return { prev };
    },
    onError: (err, _next, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['employer', 'payouts', 'upcoming'], ctx.prev);
      }
      setPauseError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not change pause state',
      );
    },
    onSuccess: () => {
      setPauseError(null);
      void queryClient.invalidateQueries({ queryKey: ['employer', 'payouts'] });
    },
  });

  const upcomingRows = upcoming.data?.data ?? [];
  const nextPayout = upcomingRows[0];

  const historyRows = history.data?.data ?? [];
  const historyPagination = history.data?.pagination;

  const columns: DataTableColumn<PayoutDto>[] = [
    {
      key: 'date',
      header: 'Date',
      sortBy: (p) => p.paidAt ?? p.scheduledFor,
      cell: (p) => formatAbsoluteDate(p.paidAt ?? p.scheduledFor),
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
      sortBy: (p) => p.status,
      cell: (p) => (
        <Badge tone={PAYOUT_STATUS_TONE[p.status]}>
          {PAYOUT_STATUS_LABEL[p.status]}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        description="Every naira out — pay outs, schedules, and invoices."
        actions={
          canMutate ? (
            <Button onClick={() => setShowTopUp(true)}>Top up wallet</Button>
          ) : null
        }
      />

      <div className="space-y-4 p-6">
        <RoutedTabs items={paymentsTabs} />

        {pauseError ? (
          <AlertBanner
            tone="danger"
            title="Couldn’t update auto-debits"
            description={pauseError}
            onDismiss={() => setPauseError(null)}
          />
        ) : null}

        <Card>
          <CardBody className="flex flex-wrap items-center gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
              <IconCalendar className="!h-6 !w-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-neutral-500">Next payout</p>
              {upcoming.isLoading ? (
                <Skeleton className="mt-1 h-7 w-32" />
              ) : nextPayout ? (
                <>
                  <p
                    className="text-2xl font-semibold text-neutral-900 tabular-nums"
                    data-numeric
                  >
                    {formatCurrency(nextPayout.amountNaira)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatAbsoluteDate(nextPayout.scheduledFor)} · {nextPayout.description}
                  </p>
                </>
              ) : (
                <p className="text-sm text-neutral-500">No scheduled payouts.</p>
              )}
            </div>
            {paused ? (
              <Badge tone="warning" variant="soft">
                Auto-debits paused
              </Badge>
            ) : null}
            {canMutate ? (
              <Button
                variant="secondary"
                loading={pauseMutation.isPending}
                onClick={() => pauseMutation.mutate(!paused)}
              >
                {paused ? 'Resume auto-debits' : 'Pause auto-debits'}
              </Button>
            ) : null}
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
              <Badge>{upcomingRows.length}</Badge>
            </CardHeader>
            <CardBody>
              {upcoming.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : upcoming.isError ? (
                <AlertBanner
                  tone="danger"
                  title="Couldn’t load upcoming payouts"
                  description={
                    upcoming.error instanceof Error
                      ? upcoming.error.message
                      : 'Unknown error'
                  }
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void upcoming.refetch()}
                    >
                      Retry
                    </Button>
                  }
                />
              ) : upcomingRows.length === 0 ? (
                <p className="text-sm text-neutral-500">No payouts on the schedule.</p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {upcomingRows.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {format(new Date(p.scheduledFor), 'EEE, d MMM')}
                        </p>
                        <p className="truncate text-xs text-neutral-500">
                          {p.description}
                        </p>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        <Badge tone={PAYOUT_STATUS_TONE[p.status]}>
                          {PAYOUT_STATUS_LABEL[p.status]}
                        </Badge>
                        <span
                          className="text-sm font-medium text-neutral-900 tabular-nums"
                          data-numeric
                        >
                          {formatCurrency(p.amountNaira)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardBody>
              {history.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : history.isError ? (
                <AlertBanner
                  tone="danger"
                  title="Couldn’t load payout history"
                  description={
                    history.error instanceof Error
                      ? history.error.message
                      : 'Unknown error'
                  }
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void history.refetch()}
                    >
                      Retry
                    </Button>
                  }
                />
              ) : (
                <>
                  <DataTable
                    data={historyRows}
                    columns={columns}
                    rowKey={(p) => p.id}
                    density="compact"
                    emptyTitle="No past payouts"
                    emptyDescription="Auto-debits will appear here after settlement."
                  />
                  {historyPagination ? (
                    <Pagination
                      page={historyPagination.page}
                      pageSize={historyPagination.pageSize}
                      total={historyPagination.total}
                      onPageChange={setHistoryPage}
                      pageSizeOptions={[10, 25, 50]}
                      onPageSizeChange={(ps) => {
                        setHistoryPageSize(ps);
                        setHistoryPage(1);
                      }}
                      itemLabel="payout"
                    />
                  ) : null}
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {canMutate ? (
        <TopUpDialog open={showTopUp} onOpenChange={setShowTopUp} />
      ) : null}
    </>
  );
}

function TopUpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [amountNaira, setAmountNaira] = useState<number>(100_000);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutate = useMutation({
    mutationFn: (input: TopUpInput) => topUpPayouts(input),
    onSuccess: (res) => {
      if (typeof window !== 'undefined') {
        window.location.assign(res.checkoutUrl);
      }
    },
    onError: (err) => {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Top-up failed',
      );
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (amountNaira < 1000) {
      setError('Minimum top-up is ₦1,000');
      return;
    }
    mutate.mutate({
      amountNaira,
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Top up wallet</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <p className="text-xs text-neutral-500">
              You’ll be redirected to Squad’s hosted checkout to complete the top-up.
            </p>
            <FormField
              label="Amount (₦)"
              required
              hint={amountNaira ? formatCurrency(amountNaira) : undefined}
            >
              <Input
                type="number"
                min={1000}
                step={1000}
                value={amountNaira}
                onChange={(e) => setAmountNaira(Number(e.target.value))}
              />
            </FormField>
            <FormField label="Description (optional)">
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Top-up for May payouts"
              />
            </FormField>
            {error ? <p className="text-xs text-danger-600">{error}</p> : null}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={mutate.isPending}>
              Continue to checkout
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
