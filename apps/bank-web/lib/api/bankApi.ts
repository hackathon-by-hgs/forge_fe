/**
 * Bank dashboard API client (Phase 4).
 *
 * Routes live under `/v1/bank/*`. Wire shapes mirror
 * `forge_be/app/src/modules/bank/dto/*` because the live OpenAPI spec at
 * `forgebe-production` doesn't include Phase 4 routes yet. When the BE
 * deploys Phase 4 and `pnpm --filter @forge/types types:gen` picks them up,
 * these can collapse to `components['schemas'][…]`.
 */

import { request } from './client';

// ── Enums ───────────────────────────────────────────────────────────────────

export type BorrowerType = 'worker' | 'business';

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

export type LoanApplicationStatusWire = 'pending' | 'approved' | 'rejected';

export type RecommendedDecisionWire =
  | 'approve'
  | 'approve_with_conditions'
  | 'reject';

export type RepaymentStatusWire = 'scheduled' | 'paid' | 'missed';

// ── DTOs ────────────────────────────────────────────────────────────────────

export interface BorrowerSummaryDto {
  id: string;
  type: BorrowerType;
  displayName: string;
  photoUrl?: string | null;
  score: number;
}

export interface LoanDto {
  id: string;
  bankId: string;
  borrowerType: BorrowerType;
  borrower: BorrowerSummaryDto;
  principalNaira: number;
  outstandingNaira: number;
  apr: number;
  termMonths?: number | null;
  repaymentPercentPerJob: number;
  status: LoanStatusWire;
  riskLevel: LoanRiskLevelWire;
  purpose?: string | null;
  disbursedAt?: string | null;
  expectedFullRepaymentAt?: string | null;
  nextPaymentDueAt?: string | null;
  scoreAtApproval?: number | null;
  predictedRepaymentRate?: number | null;
  rejectionReason?: string | null;
  createdAt: string;
}

export interface LoanRepaymentDto {
  id: string;
  loanId: string;
  amountNaira: number;
  scheduledFor?: string | null;
  paidAt?: string | null;
  status: RepaymentStatusWire;
  fromJobId?: string | null;
  fromJobTitle?: string | null;
  transactionId?: string | null;
}

export interface LoanDetailDto extends LoanDto {
  repayments: LoanRepaymentDto[];
  totalPaidNaira: number;
  onTimeRepaymentRate: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface BankLoansListResponse {
  data: LoanDto[];
  pagination: PaginationMeta;
}

export interface LoanApplicationDto {
  id: string;
  bankId: string;
  borrowerType: BorrowerType;
  borrower: BorrowerSummaryDto;
  amountRequestedNaira: number;
  termMonths: number;
  status: LoanApplicationStatusWire;
  recommendedDecision: RecommendedDecisionWire;
  recommendationConfidencePct: number;
  recommendationReason: string;
  appliedAt: string;
  decidedAt?: string | null;
}

export interface BankApplicationsListResponse {
  data: LoanApplicationDto[];
  pagination: PaginationMeta;
}

export interface BankPortfolioMetricsDto {
  activeCount: number;
  atRiskCount: number;
  disbursedTotalNaira: number;
  outstandingTotalNaira: number;
  repaymentRate: number;
  defaultRate: number;
}

export interface OpportunityBorrowerDto {
  id: string;
  displayName: string;
  score: number;
  eligibility: 'eligible' | 'pre_approved';
  maxAmountNaira: number;
}

export interface RiskRadarResponseDto {
  critical: LoanDto[];
  watchlist: LoanDto[];
  portfolio: BankPortfolioMetricsDto;
  opportunity: OpportunityBorrowerDto[];
}

export interface WorkerBorrowerMetricsDto {
  reliabilityScore: number;
  jobsCompleted: number;
  onTimeRate: number;
  totalEarnedNaira: number;
  averageWeeklyIncomeNaira: number;
  incomeVolatilityPct: number;
  eligibility: 'ineligible' | 'eligible' | 'pre_approved';
}

export interface BusinessBorrowerMetricsDto {
  creditScore: number;
  totalLaborSpendNaira: number;
  jobsPosted: number;
  workersHired: number;
  paymentTimelinessRate: number;
}

export interface BorrowerProfileDto {
  id: string;
  type: BorrowerType;
  displayName: string;
  photoUrl?: string | null;
  phoneNumber?: string | null;
  memberSince: string;
  workerMetrics?: WorkerBorrowerMetricsDto;
  businessMetrics?: BusinessBorrowerMetricsDto;
  loans: LoanDto[];
  defaultsCount: number;
}

// ── Mutation inputs ─────────────────────────────────────────────────────────

export interface DisburseLoanInput {
  principalNairaOverride?: number;
}

export interface MarkRepaymentPaidInput {
  amountNairaOverride?: number;
  transactionId?: string;
}

export interface ApproveLoanApplicationInput {
  principalNairaOverride?: number;
  aprOverride?: number;
  termMonthsOverride?: number;
}

export interface RejectLoanApplicationInput {
  reason: string;
}

// ── Filter inputs ───────────────────────────────────────────────────────────

export interface BankLoansListQuery {
  riskLevel?: LoanRiskLevelWire;
  status?: LoanStatusWire;
  borrowerType?: BorrowerType;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface BankApplicationsListQuery {
  status?: LoanApplicationStatusWire;
  borrowerType?: BorrowerType;
  recommendedDecision?: RecommendedDecisionWire;
  q?: string;
  page?: number;
  pageSize?: number;
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

function toQueryString(obj: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    params.set(k, String(v));
  }
  return params.toString();
}

// ── Risk Radar ──────────────────────────────────────────────────────────────

export function fetchRiskRadar(): Promise<RiskRadarResponseDto> {
  return request<RiskRadarResponseDto>('/v1/bank/risk-radar');
}

// ── Loans ───────────────────────────────────────────────────────────────────

export function fetchLoans(q?: BankLoansListQuery): Promise<BankLoansListResponse> {
  const query = toQueryString({ ...(q ?? {}) });
  return request<BankLoansListResponse>('/v1/bank/loans', { query });
}

export function fetchLoanDetail(id: string): Promise<LoanDetailDto> {
  return request<LoanDetailDto>(`/v1/bank/loans/${encodeURIComponent(id)}`);
}

export function disburseLoan(
  loanId: string,
  body?: DisburseLoanInput,
): Promise<LoanDto> {
  return request<LoanDto, DisburseLoanInput>(
    `/v1/bank/loans/${encodeURIComponent(loanId)}/disburse`,
    {
      method: 'POST',
      body: body ?? {},
      headers: { 'Idempotency-Key': genUuid() },
    },
  );
}

export function markRepaymentPaid(
  repaymentId: string,
  body?: MarkRepaymentPaidInput,
): Promise<LoanRepaymentDto> {
  return request<LoanRepaymentDto, MarkRepaymentPaidInput>(
    `/v1/bank/loan-repayments/${encodeURIComponent(repaymentId)}/pay`,
    {
      method: 'POST',
      body: body ?? {},
      headers: { 'Idempotency-Key': genUuid() },
    },
  );
}

// ── Applications ────────────────────────────────────────────────────────────

export function fetchApplications(
  q?: BankApplicationsListQuery,
): Promise<BankApplicationsListResponse> {
  const query = toQueryString({ ...(q ?? {}) });
  return request<BankApplicationsListResponse>('/v1/bank/loan-applications', {
    query,
  });
}

export function fetchApplicationDetail(id: string): Promise<LoanApplicationDto> {
  return request<LoanApplicationDto>(
    `/v1/bank/loan-applications/${encodeURIComponent(id)}`,
  );
}

export function approveApplication(
  id: string,
  body?: ApproveLoanApplicationInput,
): Promise<LoanDto> {
  return request<LoanDto, ApproveLoanApplicationInput>(
    `/v1/bank/loan-applications/${encodeURIComponent(id)}/approve`,
    {
      method: 'POST',
      body: body ?? {},
      headers: { 'Idempotency-Key': genUuid() },
    },
  );
}

export function rejectApplication(
  id: string,
  body: RejectLoanApplicationInput,
): Promise<LoanApplicationDto> {
  return request<LoanApplicationDto, RejectLoanApplicationInput>(
    `/v1/bank/loan-applications/${encodeURIComponent(id)}/reject`,
    {
      method: 'POST',
      body,
      headers: { 'Idempotency-Key': genUuid() },
    },
  );
}

// ── Borrower profile ────────────────────────────────────────────────────────

export function fetchBorrowerProfile(
  borrowerType: BorrowerType,
  id: string,
): Promise<BorrowerProfileDto> {
  return request<BorrowerProfileDto>(
    `/v1/bank/borrowers/${encodeURIComponent(borrowerType)}/${encodeURIComponent(id)}`,
  );
}
