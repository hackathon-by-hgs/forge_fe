/**
 * Employer-scoped Payments API client. Phase 3 endpoints.
 *
 * - `/v1/employer/transactions/*`
 * - `/v1/employer/invoices/*`
 * - `/v1/employer/payouts/*`
 *
 * `PayoutsUpcomingResponse.paused` is now embedded by the BE
 * (BE punch-list reply §1) — no separate settings call needed.
 */

import type { components } from '@forge/types/api';
import {
  ApiError,
  api,
  getAccessToken,
  getApiBaseUrl,
  parseResponseError,
} from './api';

type Nullable<T> = T | null;

// ── Transactions ────────────────────────────────────────────────────────────

type TransactionWire = components['schemas']['TransactionDto'];
export interface TransactionDto extends Omit<
  TransactionWire,
  'squadReference' | 'workerName' | 'jobId' | 'jobTitle' | 'settledAt' | 'failureReason'
> {
  squadReference: Nullable<string>;
  workerName: Nullable<string>;
  jobId: Nullable<string>;
  jobTitle: Nullable<string>;
  settledAt: Nullable<string>;
  failureReason: Nullable<string>;
}

export type TransactionStatus = TransactionDto['status'];

export interface TransactionsListResponse {
  data: TransactionDto[];
  pagination: components['schemas']['PaginationMetaDto'];
}

export type TransactionsSummaryDto =
  components['schemas']['TransactionsSummaryDto'];

export type CreateManualTransactionInput =
  components['schemas']['CreateManualTransactionDto'];

// ── Invoices ────────────────────────────────────────────────────────────────

type InvoiceWire = components['schemas']['InvoiceDto'];
export interface InvoiceDto
  extends Omit<InvoiceWire, 'dueAt' | 'paidAt' | 'pdfUrl'> {
  dueAt: Nullable<string>;
  paidAt: Nullable<string>;
  pdfUrl: Nullable<string>;
}

export type InvoiceLineItemDto = components['schemas']['InvoiceLineItemDto'];
export type InvoiceStatus = InvoiceDto['status'];

export interface InvoicesListResponse {
  data: InvoiceDto[];
  pagination: components['schemas']['PaginationMetaDto'];
}

export type GenerateBatchInvoiceInput =
  components['schemas']['GenerateBatchInvoiceDto'];

// ── Payouts ─────────────────────────────────────────────────────────────────

type PayoutWire = components['schemas']['PayoutDto'];
export interface PayoutDto extends Omit<PayoutWire, 'paidAt' | 'failedReason'> {
  paidAt: Nullable<string>;
  failedReason: Nullable<string>;
}

export type PayoutStatus = PayoutDto['status'];

/** `paused` is now embedded by the BE — no separate `/settings/squad` call. */
export interface PayoutsUpcomingResponse {
  data: PayoutDto[];
  paused: boolean;
}

export interface PayoutsHistoryResponse {
  data: PayoutDto[];
  pagination: components['schemas']['PaginationMetaDto'];
}

export type TopUpInput = components['schemas']['TopUpDto'];
export type TopUpResponse = components['schemas']['TopUpResponseDto'];
export type PayoutsPauseStatus = components['schemas']['PayoutsPauseStatusDto'];

// ── Filter inputs ───────────────────────────────────────────────────────────

export interface TransactionsListQuery {
  status?: TransactionStatus;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface InvoicesListQuery {
  status?: InvoiceStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function appendOptional(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void {
  if (value === undefined || value === null || value === '') return;
  params.set(key, String(value));
}

function buildTxnQuery(q: TransactionsListQuery | undefined): string {
  if (!q) return '';
  const p = new URLSearchParams();
  appendOptional(p, 'status', q.status);
  appendOptional(p, 'from', q.from);
  appendOptional(p, 'to', q.to);
  appendOptional(p, 'q', q.q);
  appendOptional(p, 'page', q.page);
  appendOptional(p, 'pageSize', q.pageSize);
  const s = p.toString();
  return s ? `?${s}` : '';
}

function buildInvQuery(q: InvoicesListQuery | undefined): string {
  if (!q) return '';
  const p = new URLSearchParams();
  appendOptional(p, 'status', q.status);
  appendOptional(p, 'from', q.from);
  appendOptional(p, 'to', q.to);
  appendOptional(p, 'page', q.page);
  appendOptional(p, 'pageSize', q.pageSize);
  const s = p.toString();
  return s ? `?${s}` : '';
}

function genUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Transactions ────────────────────────────────────────────────────────────

export function listTransactions(
  q?: TransactionsListQuery,
): Promise<TransactionsListResponse> {
  return api.get<TransactionsListResponse>(
    `/v1/employer/transactions${buildTxnQuery(q)}`,
  );
}

export function getTransactionsSummary(): Promise<TransactionsSummaryDto> {
  return api.get<TransactionsSummaryDto>('/v1/employer/transactions/summary');
}

export function getTransaction(id: string): Promise<TransactionDto> {
  return api.get<TransactionDto>(
    `/v1/employer/transactions/${encodeURIComponent(id)}`,
  );
}

export function createManualTransaction(
  input: CreateManualTransactionInput,
): Promise<TransactionDto> {
  return api.post<TransactionDto, CreateManualTransactionInput>(
    '/v1/employer/transactions',
    input,
    { idempotencyKey: genUuid() },
  );
}

// ── Invoices ────────────────────────────────────────────────────────────────

export function listInvoices(
  q?: InvoicesListQuery,
): Promise<InvoicesListResponse> {
  return api.get<InvoicesListResponse>(`/v1/employer/invoices${buildInvQuery(q)}`);
}

export function getInvoice(id: string): Promise<InvoiceDto> {
  return api.get<InvoiceDto>(`/v1/employer/invoices/${encodeURIComponent(id)}`);
}

export function generateBatchInvoice(
  input: GenerateBatchInvoiceInput,
): Promise<InvoiceDto> {
  return api.post<InvoiceDto, GenerateBatchInvoiceInput>(
    '/v1/employer/invoices/generate-batch',
    input,
    { idempotencyKey: genUuid() },
  );
}

export function sendInvoice(id: string): Promise<InvoiceDto> {
  return api.post<InvoiceDto>(
    `/v1/employer/invoices/${encodeURIComponent(id)}/send`,
  );
}

export function getInvoicePdf(id: string): Promise<{ pdfUrl: string }> {
  return api.get<{ pdfUrl: string }>(
    `/v1/employer/invoices/${encodeURIComponent(id)}/pdf`,
  );
}

// ── Payouts ─────────────────────────────────────────────────────────────────

export function getUpcomingPayouts(): Promise<PayoutsUpcomingResponse> {
  return api.get<PayoutsUpcomingResponse>('/v1/employer/payouts/upcoming');
}

export function getPayoutsHistory(
  page = 1,
  pageSize = 25,
): Promise<PayoutsHistoryResponse> {
  const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return api.get<PayoutsHistoryResponse>(
    `/v1/employer/payouts/history?${p.toString()}`,
  );
}

export function pausePayouts(): Promise<PayoutsPauseStatus> {
  return api.post<PayoutsPauseStatus>('/v1/employer/payouts/pause');
}

export function resumePayouts(): Promise<PayoutsPauseStatus> {
  return api.post<PayoutsPauseStatus>('/v1/employer/payouts/resume');
}

export function topUpPayouts(input: TopUpInput): Promise<TopUpResponse> {
  return api.post<TopUpResponse, TopUpInput>(
    '/v1/employer/payouts/top-up',
    input,
  );
}

// ── CSV export ──────────────────────────────────────────────────────────────

export async function downloadTransactionsCsv(
  query?: TransactionsListQuery,
): Promise<void> {
  const url = `${getApiBaseUrl()}/v1/employer/transactions/export.csv${buildTxnQuery(query)}`;
  const token = getAccessToken();
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    const next = await api.refresh();
    if (!next) {
      throw new ApiError({
        status: 401,
        code: 'AUTH_REQUIRED',
        message: 'Sign in again to export.',
      });
    }
    const retry = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'text/csv', Authorization: `Bearer ${next}` },
    });
    if (!retry.ok) throw await parseResponseError(retry);
    await triggerCsvDownload(retry);
    return;
  }

  if (!res.ok) throw await parseResponseError(res);
  await triggerCsvDownload(res);
}

async function triggerCsvDownload(res: Response): Promise<void> {
  const blob = await res.blob();
  const cd = res.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^"]+)"?/i.exec(cd);
  const filename =
    match?.[1] ?? `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

// ── Labels + tones ─────────────────────────────────────────────────────────

import type { StatusTone } from '@forge/types';

export const TRANSACTION_STATUS_LABEL: Record<TransactionStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  reversed: 'Reversed',
};

export const TRANSACTION_STATUS_TONE: Record<TransactionStatus, StatusTone> = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'danger',
  reversed: 'neutral',
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
};

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, StatusTone> = {
  draft: 'neutral',
  sent: 'info',
  paid: 'success',
};

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  scheduled: 'Scheduled',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
};

export const PAYOUT_STATUS_TONE: Record<PayoutStatus, StatusTone> = {
  scheduled: 'neutral',
  processing: 'info',
  paid: 'success',
  failed: 'danger',
};
