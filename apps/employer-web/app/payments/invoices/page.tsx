'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertBanner,
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
  PageHeader,
  Pagination,
  RoutedTabs,
  Skeleton,
  type DataTableColumn,
} from '@forge/ui';
import { IconAdd, IconReceipt } from '@forge/ui/icons';
import { formatAbsoluteDate, formatCurrency, formatShortDate } from '@forge/ui/utils';
import { paymentsTabs } from '../../../lib/nav';
import { useAuth } from '../../../lib/auth';
import { isHiringManager } from '../../../lib/roles';
import {
  generateBatchInvoice,
  getInvoice,
  getInvoicePdf,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  listInvoices,
  sendInvoice,
  type GenerateBatchInvoiceInput,
  type InvoiceDto,
  type InvoiceStatus,
  type InvoicesListQuery,
} from '../../../lib/paymentsApi';
import { ApiError } from '../../../lib/api';

const STATUS_OPTIONS: { label: string; value: 'all' | InvoiceStatus }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
];

export default function InvoicesPage() {
  const role = useAuth((s) => s.user?.role);
  const canMutate = !isHiringManager(role);

  const [status, setStatus] = useState<'all' | InvoiceStatus>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showBatch, setShowBatch] = useState(false);

  const query: InvoicesListQuery = {
    status: status === 'all' ? undefined : status,
    from: from || undefined,
    to: to || undefined,
    page,
    pageSize,
  };

  const listQuery = useQuery({
    queryKey: ['employer', 'invoices', 'list', query],
    queryFn: () => listInvoices(query),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const rows = listQuery.data?.data ?? [];
  const pagination = listQuery.data?.pagination;

  const columns: DataTableColumn<InvoiceDto>[] = [
    {
      key: 'number',
      header: 'Invoice #',
      sortBy: (i) => i.number,
      cellClassName: 'font-mono text-xs',
      cell: (i) => i.number,
    },
    {
      key: 'date',
      header: 'Issued',
      sortBy: (i) => i.issuedAt,
      cell: (i) => formatShortDate(i.issuedAt),
    },
    {
      key: 'lines',
      header: 'Line items',
      cell: (i) => `${i.lineItems.length}`,
    },
    {
      key: 'amount',
      header: 'Total',
      align: 'right',
      sortBy: (i) => i.totalNaira,
      cellClassName: 'tabular-nums font-medium',
      cell: (i) => formatCurrency(i.totalNaira),
    },
    {
      key: 'status',
      header: 'Status',
      sortBy: (i) => i.status,
      cell: (i) => (
        <Badge tone={INVOICE_STATUS_TONE[i.status]}>
          {INVOICE_STATUS_LABEL[i.status]}
        </Badge>
      ),
    },
    {
      key: 'due',
      header: 'Due',
      cell: (i) => (i.dueAt ? formatShortDate(i.dueAt) : '—'),
    },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        description="Every naira out — pay outs, schedules, and invoices."
        actions={
          canMutate ? (
            <Button
              leadingIcon={<IconAdd className="!h-4 !w-4" />}
              onClick={() => setShowBatch(true)}
            >
              Generate batch invoice
            </Button>
          ) : null
        }
      />

      <div className="space-y-4 p-6">
        <RoutedTabs items={paymentsTabs} />

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as 'all' | InvoiceStatus);
              setPage(1);
            }}
            className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Input
            type="date"
            aria-label="From"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
          <Input
            type="date"
            aria-label="To"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>

        {listQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : listQuery.isError ? (
          <AlertBanner
            tone="danger"
            title="Couldn’t load invoices"
            description={
              listQuery.error instanceof Error
                ? listQuery.error.message
                : 'Unknown error'
            }
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void listQuery.refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-outline bg-surface-container">
              <DataTable
                data={rows}
                columns={columns}
                rowKey={(i) => i.id}
                onRowClick={(i) => setSelectedId(i.id)}
                emptyTitle="No invoices yet"
                emptyDescription="Generate your first invoice from a completed job or via batch."
                emptyIcon={<IconReceipt className="!h-5 !w-5" />}
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
                itemLabel="invoice"
              />
            ) : null}
          </>
        )}
      </div>

      <InvoiceDrawer
        id={selectedId}
        canMutate={canMutate}
        onClose={() => setSelectedId(null)}
      />

      {canMutate ? (
        <BatchInvoiceDialog
          open={showBatch}
          onOpenChange={setShowBatch}
          onCreated={(inv) => setSelectedId(inv.id)}
        />
      ) : null}
    </>
  );
}

function InvoiceDrawer({
  id,
  canMutate,
  onClose,
}: {
  id: string | null;
  canMutate: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const detail = useQuery({
    queryKey: ['employer', 'invoices', 'detail', id],
    queryFn: () => getInvoice(id as string),
    enabled: !!id,
    retry: false,
  });

  const [sendError, setSendError] = useState<{ code: string; message: string } | null>(
    null,
  );
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [sendOk, setSendOk] = useState(false);

  const send = useMutation({
    mutationFn: () => sendInvoice(id as string),
    onSuccess: () => {
      setSendError(null);
      setSendOk(true);
      void queryClient.invalidateQueries({ queryKey: ['employer', 'invoices'] });
    },
    onError: (err) => {
      if (err instanceof ApiError) setSendError({ code: err.code, message: err.message });
      else setSendError({ code: 'INTERNAL', message: 'Send failed' });
    },
  });

  const downloadPdf = useMutation({
    mutationFn: () => getInvoicePdf(id as string),
    onSuccess: (res) => {
      setPdfError(null);
      if (typeof window !== 'undefined') {
        window.open(res.pdfUrl, '_blank', 'noopener');
      }
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        if (err.code === 'PDF_NOT_READY' || err.status === 503) {
          setPdfError('PDF is still generating — try again in a moment.');
          return;
        }
        if (err.status === 404) {
          setPdfError('Invoice not found.');
          return;
        }
      }
      setPdfError(err instanceof Error ? err.message : 'Couldn’t download PDF');
    },
  });

  const inv = detail.data;

  return (
    <Drawer
      open={!!id}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setSendError(null);
          setSendOk(false);
          setPdfError(null);
        }
      }}
    >
      <DrawerContent width="w-[560px]">
        <DrawerHeader>
          <DrawerTitle>Invoice</DrawerTitle>
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
              title="Couldn’t load invoice"
              description={
                detail.error instanceof ApiError && detail.error.status === 404
                  ? 'This invoice no longer exists.'
                  : detail.error instanceof Error
                    ? detail.error.message
                    : 'Unknown error'
              }
            />
          ) : inv ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-medium text-neutral-900">
                    {inv.number}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Issued {formatAbsoluteDate(inv.issuedAt)}
                  </p>
                </div>
                <Badge tone={INVOICE_STATUS_TONE[inv.status]}>
                  {INVOICE_STATUS_LABEL[inv.status]}
                </Badge>
              </div>

              <div className="rounded-lg border border-outline bg-surface">
                <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Line items
                </div>
                <ul className="divide-y divide-neutral-100">
                  {inv.lineItems.map((li, idx) => (
                    <li
                      key={`${li.jobId}-${idx}`}
                      className="flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-900">
                          {li.jobTitle}
                        </p>
                        <p className="truncate text-xs text-neutral-500">
                          {li.workerName} · {li.jobId}
                        </p>
                      </div>
                      <span
                        className="ml-3 shrink-0 text-sm font-medium tabular-nums text-neutral-900"
                        data-numeric
                      >
                        {formatCurrency(li.amountNaira)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <KeyValueList
                items={[
                  { label: 'Subtotal', value: formatCurrency(inv.subtotalNaira) },
                  { label: 'Total', value: formatCurrency(inv.totalNaira) },
                  {
                    label: 'Due',
                    value: inv.dueAt ? formatAbsoluteDate(inv.dueAt) : '—',
                  },
                  {
                    label: 'Paid',
                    value: inv.paidAt ? formatAbsoluteDate(inv.paidAt) : '—',
                  },
                ]}
              />

              {sendOk ? (
                <AlertBanner
                  tone="success"
                  title="Invoice sent"
                  description="Email dispatched to the invoicing address."
                  onDismiss={() => setSendOk(false)}
                />
              ) : null}

              {sendError ? (
                sendError.code === 'INVOICING_EMAIL_MISSING' ? (
                  <AlertBanner
                    tone="warning"
                    title="No invoicing email set"
                    description="Add an invoicing email in Settings → Billing to send invoices."
                    action={
                      <Link href="/settings/billing">
                        <Button size="sm" variant="secondary">
                          Open Billing
                        </Button>
                      </Link>
                    }
                  />
                ) : (
                  <AlertBanner
                    tone="danger"
                    title="Send failed"
                    description={sendError.message}
                    onDismiss={() => setSendError(null)}
                  />
                )
              ) : null}

              {pdfError ? (
                <AlertBanner
                  tone="warning"
                  title="PDF not ready"
                  description={pdfError}
                  onDismiss={() => setPdfError(null)}
                />
              ) : null}
            </>
          ) : null}
        </DrawerBody>
        <DrawerFooter>
          <Button
            variant="ghost"
            disabled={!inv || downloadPdf.isPending}
            loading={downloadPdf.isPending}
            onClick={() => downloadPdf.mutate()}
            title={inv && !inv.pdfUrl ? 'PDF render lands in Phase 5' : undefined}
          >
            Download PDF
          </Button>
          {canMutate && inv && inv.status !== 'paid' ? (
            <Button loading={send.isPending} onClick={() => send.mutate()}>
              {inv.status === 'sent' ? 'Resend' : 'Send invoice'}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function BatchInvoiceDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (inv: InvoiceDto) => void;
}) {
  const queryClient = useQueryClient();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [workerIds, setWorkerIds] = useState('');
  const [jobIds, setJobIds] = useState('');
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const mutate = useMutation({
    mutationFn: (input: GenerateBatchInvoiceInput) => generateBatchInvoice(input),
    onSuccess: (inv) => {
      void queryClient.invalidateQueries({ queryKey: ['employer', 'invoices'] });
      onCreated(inv);
      onOpenChange(false);
      setFrom('');
      setTo('');
      setWorkerIds('');
      setJobIds('');
      setError(null);
    },
    onError: (err) => {
      if (err instanceof ApiError) setError({ code: err.code, message: err.message });
      else setError({ code: 'INTERNAL', message: 'Generation failed' });
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!from || !to) {
      setError({ code: 'VALIDATION_FAILED', message: 'Pick both a from and to date' });
      return;
    }
    if (from >= to) {
      setError({ code: 'INVALID_RANGE', message: '"From" must be before "to".' });
      return;
    }
    const splitIds = (s: string) =>
      s
        .split(/[\s,]+/)
        .map((x) => x.trim())
        .filter(Boolean);
    mutate.mutate({
      from,
      to,
      workerIds: workerIds ? splitIds(workerIds) : undefined,
      jobIds: jobIds ? splitIds(jobIds) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Generate batch invoice</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <p className="text-xs text-neutral-500">
              Aggregates every completed job whose <code>completedAt</code>{' '}
              falls in <strong>[from, to)</strong> into a single invoice.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="From" required>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </FormField>
              <FormField label="To (exclusive)" required>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </FormField>
            </div>
            <FormField
              label="Worker IDs (optional)"
              hint="Comma or space separated."
            >
              <Input
                placeholder="wkr_0042, wkr_0099"
                value={workerIds}
                onChange={(e) => setWorkerIds(e.target.value)}
              />
            </FormField>
            <FormField
              label="Job IDs (optional)"
              hint="Comma or space separated."
            >
              <Input
                placeholder="job_00123, job_00456"
                value={jobIds}
                onChange={(e) => setJobIds(e.target.value)}
              />
            </FormField>
            {error ? (
              error.code === 'NO_INVOICEABLE_JOBS' ? (
                <p className="text-xs text-warning-700">
                  No completed jobs in that range. Try widening it or removing
                  the filters.
                </p>
              ) : (
                <p className="text-xs text-danger-600">{error.message}</p>
              )
            ) : null}
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
              Generate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
