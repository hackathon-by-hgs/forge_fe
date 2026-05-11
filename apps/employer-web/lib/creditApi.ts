/**
 * Employer-scoped Credit + Loans + Loan-applications API client.
 *
 * Routes under `/v1/employer/credit*`, `/v1/employer/loans*`, and
 * `/v1/employer/loan-applications*`. Shapes mirror
 * `forge_be/app/src/modules/employer-credit/dto/*`.
 */

import { api } from './api';

// ── Enums ───────────────────────────────────────────────────────────────────

export type EmployerEligibilityTier = 'ineligible' | 'eligible' | 'pre_approved';

export type EmployerCreditFactorKey =
  | 'payment_timeliness'
  | 'worker_retention'
  | 'transaction_consistency'
  | 'growth_trend'
  | 'time_on_platform';

export type LoanStatusWire =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'active'
  | 'at_risk'
  | 'repaid'
  | 'defaulted'
  | 'rejected'
  | 'written_off';

export type LoanRiskLevelWire = 'green' | 'yellow' | 'red';

export type EmployerLoanApplicationStatus = 'pending' | 'approved' | 'rejected';

export type RecommendedDecision = 'approve' | 'reject' | 'review';

export type RepaymentStatusWire = 'scheduled' | 'paid' | 'missed';

// ── Shapes ──────────────────────────────────────────────────────────────────

export interface ScorePoint {
  date: string;
  score: number;
}

export interface EmployerCreditFactor {
  key: EmployerCreditFactorKey;
  label: string;
  value: number;
  weight: number;
  trend: number[];
  rationale: string;
}

export interface EmployerEligibility {
  tier: EmployerEligibilityTier;
  maxAmountNaira: number;
  aprPct: number;
  estimatedDecisionAt: string | null;
}

export interface EmployerLoanSummary {
  id: string;
  status: LoanStatusWire;
  principalNaira: number;
  outstandingNaira: number;
  apr: number;
  termMonths: number | null;
  disbursedAt: string | null;
  nextPaymentDueAt: string | null;
  expectedFullRepaymentAt: string | null;
  bankName: string | null;
  riskLevel: LoanRiskLevelWire;
}

export interface EmployerCreditDto {
  score: number;
  scoreDeltaPoints: number;
  trend12Week: ScorePoint[];
  factors: EmployerCreditFactor[];
  eligibility: EmployerEligibility;
  activeLoan: EmployerLoanSummary | null;
  pastLoans: EmployerLoanSummary[];
}

export interface EmployerScoreHistoryDto {
  data: ScorePoint[];
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  amountNaira: number;
  scheduledFor: string | null;
  paidAt: string | null;
  status: RepaymentStatusWire;
  fromJobId: string | null;
  fromJobTitle: string | null;
  transactionId: string | null;
}

export interface EmployerLoanDto {
  id: string;
  bankId: string;
  bankName: string;
  principalNaira: number;
  outstandingNaira: number;
  apr: number;
  termMonths: number | null;
  repaymentPercentPerJob: number;
  status: LoanStatusWire;
  riskLevel: LoanRiskLevelWire;
  purpose: string | null;
  disbursedAt: string | null;
  expectedFullRepaymentAt: string | null;
  nextPaymentDueAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface EmployerLoanDetailDto extends EmployerLoanDto {
  repayments: LoanRepayment[];
  totalPaidNaira: number;
  onTimeRepaymentRate: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface EmployerLoansListResponse {
  data: EmployerLoanDto[];
  pagination: PaginationMeta;
}

export interface EmployerLoanRepaymentsResponse {
  data: LoanRepayment[];
}

export interface EmployerLoanApplicationDto {
  id: string;
  bankId: string;
  bankName: string;
  borrowerType: 'business';
  amountRequestedNaira: number;
  termMonths: number;
  purpose: string | null;
  appliedAt: string;
  status: EmployerLoanApplicationStatus;
  decidedAt: string | null;
  recommendedDecision: RecommendedDecision;
  recommendationConfidencePct: number;
  recommendationReason: string;
}

export interface EmployerLoanApplicationsListResponse {
  data: EmployerLoanApplicationDto[];
  pagination: PaginationMeta;
}

export interface CreateEmployerLoanApplicationInput {
  amountNaira: number;
  termMonths: number;
  bankId?: string;
  purpose?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function genUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function toQS(obj: Record<string, unknown>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

// ── Credit ──────────────────────────────────────────────────────────────────

export function getCredit(): Promise<EmployerCreditDto> {
  return api.get<EmployerCreditDto>('/v1/employer/credit');
}

export function getScoreHistory(): Promise<EmployerScoreHistoryDto> {
  return api.get<EmployerScoreHistoryDto>('/v1/employer/credit/score-history');
}

// ── Loan applications ──────────────────────────────────────────────────────

export function listLoanApplications(
  q?: { status?: EmployerLoanApplicationStatus; page?: number; pageSize?: number },
): Promise<EmployerLoanApplicationsListResponse> {
  return api.get<EmployerLoanApplicationsListResponse>(
    `/v1/employer/loan-applications${toQS({ ...(q ?? {}) })}`,
  );
}

export function getLoanApplication(id: string): Promise<EmployerLoanApplicationDto> {
  return api.get<EmployerLoanApplicationDto>(
    `/v1/employer/loan-applications/${encodeURIComponent(id)}`,
  );
}

export function createLoanApplication(
  input: CreateEmployerLoanApplicationInput,
): Promise<EmployerLoanApplicationDto> {
  return api.post<EmployerLoanApplicationDto, CreateEmployerLoanApplicationInput>(
    '/v1/employer/loan-applications',
    input,
    { idempotencyKey: genUuid() },
  );
}

// ── Loans ──────────────────────────────────────────────────────────────────

export function listEmployerLoans(
  q?: { status?: LoanStatusWire; page?: number; pageSize?: number },
): Promise<EmployerLoansListResponse> {
  return api.get<EmployerLoansListResponse>(
    `/v1/employer/loans${toQS({ ...(q ?? {}) })}`,
  );
}

export function getEmployerLoan(id: string): Promise<EmployerLoanDetailDto> {
  return api.get<EmployerLoanDetailDto>(
    `/v1/employer/loans/${encodeURIComponent(id)}`,
  );
}

export function getEmployerLoanRepayments(
  id: string,
): Promise<EmployerLoanRepaymentsResponse> {
  return api.get<EmployerLoanRepaymentsResponse>(
    `/v1/employer/loans/${encodeURIComponent(id)}/repayments`,
  );
}
