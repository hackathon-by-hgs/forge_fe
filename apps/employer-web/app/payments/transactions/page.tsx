'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { browseWorkers, type WorkerSummaryDto } from '../../../lib/workersApi';
import {
  AlertBanner,
  Avatar,
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  FormField,
  Input,
  KeyValueList,
  MetricTile,
  PageHeader,
  Pagination,
  RoutedTabs,
  Select,
  Skeleton,
  Textarea,
  type DataTableColumn,
} from '@forge/ui';
import { IconAdd, IconBank, IconCredit, IconSearch } from '@forge/ui/icons';
import {
  formatAbsoluteDate,
  formatCurrency,
  formatRelativeTime,
  formatTransactionId,
} from '@forge/ui/utils';
import { paymentsTabs } from '../../../lib/nav';
import { useAuth } from '../../../lib/auth';
import { isHiringManager } from '../../../lib/roles';
import {
  classifyEmployerTxn,
  createManualTransaction,
  downloadTransactionsCsv,
  getTransaction,
  getTransactionsSummary,
  isRealSquadReference,
  listTransactions,
  TRANSACTION_STATUS_LABEL,
  TRANSACTION_STATUS_TONE,
  type CreateManualTransactionInput,
  type EmployerTxnRowKind,
  type TransactionDto,
  type TransactionStatus,
  type TransactionsListQuery,
} from '../../../lib/paymentsApi';
import { ApiError } from '../../../lib/api';

const STATUS_OPTIONS: { label: string; value: 'all' | TransactionStatus }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Reversed', value: 'reversed' },
];

export default function TransactionsPage() {
  const role = useAuth((s) => s.user?.role);
  const canSend = !isHiringManager(role);

  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSend, setShowSend] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, from, to, debouncedSearch, pageSize]);

  const query: TransactionsListQuery = useMemo(
    () => ({
      status: statusFilter === 'all' ? undefined : statusFilter,
      from: from || undefined,
      to: to || undefined,
      q: debouncedSearch || undefined,
      page,
      pageSize,
    }),
    [statusFilter, from, to, debouncedSearch, page, pageSize],
  );

  const summaryQuery = useQuery({
    queryKey: ['employer', 'transactions', 'summary'],
    queryFn: getTransactionsSummary,
    retry: false,
  });

  const listQuery = useQuery({
    queryKey: ['employer', 'transactions', 'list', query],
    queryFn: () => listTransactions(query),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const rows = listQuery.data?.data ?? [];
  const pagination = listQuery.data?.pagination;

  const handleCsv = async () => {
    setCsvLoading(true);
    setCsvError(null);
    try {
      await downloadTransactionsCsv({ ...query, page: undefined, pageSize: undefined });
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : 'CSV export failed');
    } finally {
      setCsvLoading(false);
    }
  };

  const columns: DataTableColumn<TransactionDto>[] = [
    {
      key: 'date',
      header: 'Date',
      sortBy: (t) => t.timestamp,
      cell: (t) => (
        <span className="text-xs text-neutral-500">{formatRelativeTime(t.timestamp)}</span>
      ),
    },
    {
      key: 'counterparty',
      header: 'Counterparty',
      cell: (t) => <CounterpartyCell t={t} />,
    },
    {
      key: 'job',
      header: 'Job',
      cell: (t) =>
        t.jobTitle ? <span className="text-sm">{t.jobTitle}</span> : '—',
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortBy: (t) => t.amountNaira,
      cellClassName: 'tabular-nums font-medium',
      cell: (t) => {
        const kind = classifyEmployerTxn(t);
        const isCredit = kind === 'top_up' || kind === 'loan_disbursement' || kind === 'wallet_credit';
        return (
          <span className={isCredit ? 'text-success-700' : undefined}>
            {isCredit ? '+' : ''}
            {formatCurrency(t.amountNaira)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortBy: (t) => t.status,
      cell: (t) => (
        <Badge tone={TRANSACTION_STATUS_TONE[t.status]}>
          {TRANSACTION_STATUS_LABEL[t.status]}
        </Badge>
      ),
    },
    {
      key: 'reference',
      header: 'Squad ref',
      cellClassName: 'font-mono text-xs text-neutral-500',
      cell: (t) =>
        isRealSquadReference(t.squadReference)
          ? formatTransactionId(t.squadReference!)
          : t.squadReference
            ? <span className="text-neutral-400" title="Internal book entry, not a Squad reference">internal</span>
            : '—',
    },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        description="Every naira out — pay outs, schedules, and invoices."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={csvLoading}
              onClick={() => void handleCsv()}
            >
              Export CSV
            </Button>
            {canSend ? (
              <Button
                leadingIcon={<IconAdd className="!h-4 !w-4" />}
                onClick={() => setShowSend(true)}
              >
                Send payment
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="space-y-4 p-6">
        <RoutedTabs items={paymentsTabs} />

        <SummaryTiles
          isLoading={summaryQuery.isLoading}
          data={summaryQuery.data}
          error={summaryQuery.error}
        />

        {csvError ? (
          <AlertBanner
            tone="danger"
            title="Export failed"
            description={csvError}
            onDismiss={() => setCsvError(null)}
          />
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Search by worker, Squad ref, or job ID…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            className="max-w-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            aria-label="Status"
            options={STATUS_OPTIONS}
            className="w-44"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | TransactionStatus)
            }
          />
          <Input
            type="date"
            aria-label="From"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
          />
          <Input
            type="date"
            aria-label="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
          />
        </div>

        {listQuery.isError ? (
          <AlertBanner
            tone="danger"
            title="Couldn’t load transactions"
            description={
              listQuery.error instanceof Error
                ? listQuery.error.message
                : 'Unknown error'
            }
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
                rowKey={(t) => t.id}
                onRowClick={(t) => setSelectedId(t.id)}
                emptyTitle="No transactions"
                emptyDescription="Payments to workers will appear here in real time."
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
                itemLabel="transaction"
              />
            ) : null}
          </>
        )}
      </div>

      <TransactionDrawer id={selectedId} onClose={() => setSelectedId(null)} />

      {canSend ? (
        <SendPaymentDialog open={showSend} onOpenChange={setShowSend} />
      ) : null}
    </>
  );
}

function CounterpartyCell({ t }: { t: TransactionDto }) {
  const kind = classifyEmployerTxn(t);
  if (kind === 'job_payment') {
    return t.workerName ? (
      <div className="flex items-center gap-2">
        <Avatar name={t.workerName} size="sm" />
        <span className="text-sm">{t.workerName}</span>
      </div>
    ) : (
      <span className="text-xs text-neutral-400">{t.workerId ?? '—'}</span>
    );
  }
  const meta: Record<Exclude<EmployerTxnRowKind, 'job_payment'>, { label: string; icon: ReactNode }> = {
    top_up: {
      label: 'External top-up',
      icon: <IconBank className="!h-3.5 !w-3.5" />,
    },
    loan_disbursement: {
      label: 'Loan disbursement',
      icon: <IconCredit className="!h-3.5 !w-3.5" />,
    },
    wallet_credit: {
      label: 'Wallet credit',
      icon: <IconBank className="!h-3.5 !w-3.5" />,
    },
  };
  const { label, icon } = meta[kind];
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-info-50 text-info-600">
        {icon}
      </span>
      <span className="text-sm text-neutral-700">{label}</span>
    </div>
  );
}

function SummaryTiles({
  isLoading,
  data,
  error,
}: {
  isLoading: boolean;
  data: Awaited<ReturnType<typeof getTransactionsSummary>> | undefined;
  error: unknown;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  if (error || !data) {
    return (
      <AlertBanner
        tone="warning"
        title="Couldn’t load summary"
        description={error instanceof Error ? error.message : 'Unknown error'}
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricTile
        label="Paid this month"
        value={formatCurrency(data.paidThisMonthNaira, { compact: true })}
      />
      <MetricTile
        label="Pending"
        value={formatCurrency(data.pendingAmountNaira, { compact: true })}
        hint={`${data.pendingCount} transaction${data.pendingCount === 1 ? '' : 's'}`}
      />
      <MetricTile
        label="Avg job cost (90d)"
        value={formatCurrency(data.averageJobCostNaira)}
      />
      <MetricTile
        label="Largest payment (90d)"
        value={formatCurrency(data.largestPaymentNaira)}
      />
    </div>
  );
}

function TransactionDrawer({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const detail = useQuery({
    queryKey: ['employer', 'transactions', 'detail', id],
    queryFn: () => getTransaction(id as string),
    enabled: !!id,
    retry: false,
  });

  return (
    <Drawer open={!!id} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Transaction</DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          {detail.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : detail.isError ? (
            <AlertBanner
              tone="danger"
              title="Couldn’t load transaction"
              description={
                detail.error instanceof ApiError && detail.error.status === 404
                  ? 'This transaction is no longer available.'
                  : detail.error instanceof Error
                    ? detail.error.message
                    : 'Unknown error'
              }
            />
          ) : detail.data ? (
            <>
              <div className="flex items-center justify-between">
                <Badge tone={TRANSACTION_STATUS_TONE[detail.data.status]}>
                  {TRANSACTION_STATUS_LABEL[detail.data.status]}
                </Badge>
                <span
                  className="text-2xl font-semibold text-neutral-900 tabular-nums"
                  data-numeric
                >
                  {formatCurrency(detail.data.amountNaira)}
                </span>
              </div>
              <KeyValueList
                items={[
                  {
                    label: 'Transaction',
                    value: <span className="font-mono text-xs">{detail.data.id}</span>,
                  },
                  {
                    label: 'Squad reference',
                    value: isRealSquadReference(detail.data.squadReference) ? (
                      <span className="font-mono text-xs">{detail.data.squadReference}</span>
                    ) : detail.data.squadReference ? (
                      <span
                        className="text-xs text-neutral-500"
                        title="Internal book entry, not a Squad reference"
                      >
                        Internal book entry
                      </span>
                    ) : (
                      '—'
                    ),
                  },
                  {
                    label: 'Worker',
                    value: detail.data.workerName ?? detail.data.workerId ?? '—',
                  },
                  {
                    label: 'Job',
                    value: detail.data.jobTitle ?? (detail.data.jobId ?? '—'),
                  },
                  {
                    label: 'Initiated',
                    value: formatAbsoluteDate(detail.data.timestamp),
                  },
                  {
                    label: 'Settled',
                    value: detail.data.settledAt
                      ? formatAbsoluteDate(detail.data.settledAt)
                      : '—',
                  },
                  detail.data.failureReason
                    ? { label: 'Failure', value: detail.data.failureReason }
                    : null,
                ].filter((x): x is NonNullable<typeof x> => Boolean(x))}
              />
              {detail.data.status === 'pending' ? (
                <AlertBanner
                  tone="info"
                  title="Pending settlement"
                  description="The Squad webhook will mark this completed once funds settle."
                />
              ) : null}
            </>
          ) : null}
        </DrawerBody>
        <DrawerFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function SendPaymentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState<WorkerSummaryDto | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [amountNaira, setAmountNaira] = useState<number>(5000);
  const [jobId, setJobId] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const suggestions = useQuery({
    queryKey: ['employer', 'workers', 'suggest', debouncedSearch],
    queryFn: () =>
      browseWorkers({ q: debouncedSearch, pageSize: 6, page: 1 }),
    enabled: open && debouncedSearch.length >= 2 && !picked,
    retry: false,
    staleTime: 30_000,
  });

  const reset = () => {
    setPicked(null);
    setSearch('');
    setDebouncedSearch('');
    setShowResults(false);
    setAmountNaira(5000);
    setJobId('');
    setDescription('');
    setError(null);
    setFieldErrors({});
  };

  const mutate = useMutation({
    mutationFn: (input: CreateManualTransactionInput) =>
      createManualTransaction(input),
    onSuccess: (txn) => {
      void queryClient.invalidateQueries({ queryKey: ['employer', 'transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['employer', 'overview'] });
      queryClient.setQueryData<unknown>(
        ['employer', 'transactions', 'detail', txn.id],
        txn,
      );
      onOpenChange(false);
      reset();
    },
    onError: (err) => {
      const fe = fieldErrorsFromApi(err);
      if (fe) setFieldErrors(fe);
      setError(humanError(err));
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const local: Record<string, string> = {};
    if (!picked) local.workerId = 'Pick a worker from the list';
    if (amountNaira < 100) local.amountNaira = 'Minimum is ₦100';
    if (Object.keys(local).length) {
      setFieldErrors(local);
      return;
    }
    mutate.mutate({
      workerId: picked!.id,
      amountNaira,
      jobId: jobId.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Send payment</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <p className="text-xs text-neutral-500">
              Manual transfers post as <strong>pending</strong> until the Squad webhook
              confirms settlement.
            </p>
            <FormField label="Worker" required error={fieldErrors.workerId}>
              {picked ? (
                <div className="flex items-center gap-2 rounded-md border border-outline bg-surface px-3 py-2">
                  <Avatar
                    name={picked.fullName}
                    src={picked.photoUrl ?? undefined}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {picked.fullName}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {picked.primarySkill} · {picked.homeNeighborhood ?? '—'} · {picked.id}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setPicked(null);
                      setShowResults(true);
                      setTimeout(() => searchInputRef.current?.focus(), 0);
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    ref={searchInputRef}
                    placeholder="Search by name or worker id…"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                  />
                  {showResults && debouncedSearch.length >= 2 ? (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-md border border-outline bg-surface shadow-md">
                      {suggestions.isLoading ? (
                        <p className="px-3 py-2 text-xs text-neutral-500">
                          Searching…
                        </p>
                      ) : suggestions.isError ? (
                        <p className="px-3 py-2 text-xs text-danger-600">
                          Couldn’t search workers
                        </p>
                      ) : (suggestions.data?.data ?? []).length === 0 ? (
                        <p className="px-3 py-2 text-xs text-neutral-500">
                          No workers match.
                        </p>
                      ) : (
                        (suggestions.data?.data ?? []).map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => {
                              setPicked(w);
                              setShowResults(false);
                              setSearch('');
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-container-high"
                          >
                            <Avatar
                              name={w.fullName}
                              src={w.photoUrl ?? undefined}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-neutral-900">
                                {w.fullName}
                              </p>
                              <p className="truncate text-xs text-neutral-500">
                                {w.primarySkill} · {w.homeNeighborhood ?? '—'} · score{' '}
                                {w.reliabilityScore}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </FormField>
            <FormField
              label="Amount (₦)"
              required
              error={fieldErrors.amountNaira}
              hint={amountNaira ? formatCurrency(amountNaira) : undefined}
            >
              <Input
                type="number"
                min={100}
                step={100}
                value={amountNaira}
                onChange={(e) => setAmountNaira(Number(e.target.value))}
              />
            </FormField>
            <FormField label="Linked job (optional)" error={fieldErrors.jobId}>
              <Input
                placeholder="job_00123"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
              />
            </FormField>
            <FormField label="Description (optional)">
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bonus for double-shift on Tuesday"
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
              Send payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function humanError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

function fieldErrorsFromApi(err: unknown): Record<string, string> | null {
  if (!(err instanceof ApiError) || err.code !== 'VALIDATION_FAILED') return null;
  const errors =
    (err.details?.errors as Array<{ field?: string; message?: string }>) ?? [];
  const out: Record<string, string> = {};
  for (const e of errors) {
    if (e?.field) out[e.field] = e.message ?? 'Invalid value';
  }
  return Object.keys(out).length ? out : null;
}
