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
import { ApiError } from './errors';

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

function numField(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

const EMPTY_PORTFOLIO: BankPortfolioMetricsDto = {
  activeCount: 0,
  atRiskCount: 0,
  disbursedTotalNaira: 0,
  outstandingTotalNaira: 0,
  repaymentRate: 0,
  defaultRate: 0,
};

const LOAN_STATUS_SET = new Set<string>([
  'draft',
  'pending_review',
  'approved',
  'active',
  'at_risk',
  'repaid',
  'defaulted',
  'rejected',
  'written_off',
]);

const RISK_LEVEL_SET = new Set<string>(['green', 'yellow', 'red']);

const APPLICATION_STATUS_SET = new Set<string>(['pending', 'approved', 'rejected']);

const RECOMMENDED_DECISION_SET = new Set<string>([
  'approve',
  'approve_with_conditions',
  'reject',
]);

function normalizePaginationMeta(
  raw: unknown,
  fallbacks: { page: number; pageSize: number },
): PaginationMeta {
  const fp = Math.max(1, Math.floor(numField(fallbacks.page, 1)));
  const fps = Math.max(1, Math.min(100, Math.floor(numField(fallbacks.pageSize, 25))));
  if (!raw || typeof raw !== 'object') {
    return { page: fp, pageSize: fps, total: 0, totalPages: 1 };
  }
  const p = raw as Record<string, unknown>;
  const pageSize = Math.max(1, Math.min(100, Math.floor(numField(p.pageSize, fps))));
  const total = Math.max(0, Math.floor(numField(p.total, 0)));
  const totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / pageSize));
  let page = Math.max(1, Math.floor(numField(p.page, fp)));
  if (page > totalPages) page = totalPages;
  return { page, pageSize, total, totalPages };
}

/**
 * Coerce `GET /v1/bank/loan-applications` JSON into a safe shape (lists, pagination,
 * and each row) so the queue UI never throws on partial API payloads.
 */
export function normalizeBankApplicationsListResponse(
  raw: unknown,
  request: Pick<BankApplicationsListQuery, 'page' | 'pageSize'> = {},
): BankApplicationsListResponse {
  const fallbackPage = Math.max(1, Math.floor(numField(request.page, 1)));
  const fallbackPageSize = Math.max(
    1,
    Math.min(100, Math.floor(numField(request.pageSize, 25))),
  );

  if (!raw || typeof raw !== 'object') {
    return {
      data: [],
      pagination: normalizePaginationMeta(undefined, {
        page: fallbackPage,
        pageSize: fallbackPageSize,
      }),
    };
  }

  const o = raw as Record<string, unknown>;
  const dataIn = Array.isArray(o.data) ? o.data : [];
  const pagination = normalizePaginationMeta(o.pagination, {
    page: fallbackPage,
    pageSize: fallbackPageSize,
  });

  return {
    data: dataIn
      .map(normalizeLoanApplicationDto)
      .filter((row): row is LoanApplicationDto => row !== null),
    pagination,
  };
}

function normalizeBorrowerSummary(raw: unknown): BorrowerSummaryDto {
  if (!raw || typeof raw !== 'object') {
    return {
      id: 'unknown',
      type: 'worker',
      displayName: 'Unknown borrower',
      score: 0,
    };
  }
  const b = raw as Record<string, unknown>;
  const id = typeof b.id === 'string' && b.id ? b.id : 'unknown';
  const displayName =
    typeof b.displayName === 'string' && b.displayName.trim().length > 0
      ? b.displayName.trim()
      : 'Unknown borrower';
  const type: BorrowerType = b.type === 'business' ? 'business' : 'worker';
  return {
    id,
    type,
    displayName,
    photoUrl:
      typeof b.photoUrl === 'string'
        ? b.photoUrl
        : b.photoUrl === null
          ? null
          : undefined,
    score: numField(b.score, 0),
  };
}

function normalizeLoanApplicationDto(raw: unknown): LoanApplicationDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id) return null;

  const statusRaw = r.status;
  const recRaw = r.recommendedDecision;
  const status: LoanApplicationStatusWire =
    typeof statusRaw === 'string' && APPLICATION_STATUS_SET.has(statusRaw)
      ? (statusRaw as LoanApplicationStatusWire)
      : 'pending';
  const recommendedDecision: RecommendedDecisionWire =
    typeof recRaw === 'string' && RECOMMENDED_DECISION_SET.has(recRaw)
      ? (recRaw as RecommendedDecisionWire)
      : 'reject';

  const decidedRaw = r.decidedAt;
  const decidedAt =
    typeof decidedRaw === 'string'
      ? decidedRaw
      : decidedRaw === null
        ? null
        : undefined;

  return {
    id: r.id,
    bankId: typeof r.bankId === 'string' ? r.bankId : '',
    borrowerType: r.borrowerType === 'business' ? 'business' : 'worker',
    borrower: normalizeBorrowerSummary(r.borrower),
    amountRequestedNaira: numField(r.amountRequestedNaira, 0),
    termMonths: Math.max(1, Math.floor(numField(r.termMonths, 1))),
    status,
    recommendedDecision,
    recommendationConfidencePct: Math.min(
      100,
      Math.max(0, numField(r.recommendationConfidencePct, 0)),
    ),
    recommendationReason:
      typeof r.recommendationReason === 'string' ? r.recommendationReason : '',
    appliedAt:
      typeof r.appliedAt === 'string' ? r.appliedAt : new Date(0).toISOString(),
    decidedAt,
  };
}

function normalizeLoanDto(raw: unknown): LoanDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const l = raw as Record<string, unknown>;
  if (typeof l.id !== 'string' || !l.id) return null;

  const borrower = normalizeBorrowerSummary(l.borrower);
  const statusRaw = l.status;
  const riskRaw = l.riskLevel;
  const borrowerType: BorrowerType = l.borrowerType === 'business' ? 'business' : 'worker';

  return {
    id: l.id,
    bankId: typeof l.bankId === 'string' ? l.bankId : '',
    borrowerType,
    borrower,
    principalNaira: numField(l.principalNaira, 0),
    outstandingNaira: numField(l.outstandingNaira, 0),
    apr: numField(l.apr, 0),
    termMonths: typeof l.termMonths === 'number' ? l.termMonths : null,
    repaymentPercentPerJob: numField(l.repaymentPercentPerJob, 0),
    status:
      typeof statusRaw === 'string' && LOAN_STATUS_SET.has(statusRaw)
        ? (statusRaw as LoanStatusWire)
        : 'pending_review',
    riskLevel:
      typeof riskRaw === 'string' && RISK_LEVEL_SET.has(riskRaw)
        ? (riskRaw as LoanRiskLevelWire)
        : 'green',
    purpose: typeof l.purpose === 'string' ? l.purpose : null,
    disbursedAt: typeof l.disbursedAt === 'string' ? l.disbursedAt : null,
    expectedFullRepaymentAt:
      typeof l.expectedFullRepaymentAt === 'string' ? l.expectedFullRepaymentAt : null,
    nextPaymentDueAt: typeof l.nextPaymentDueAt === 'string' ? l.nextPaymentDueAt : null,
    scoreAtApproval: typeof l.scoreAtApproval === 'number' ? l.scoreAtApproval : null,
    predictedRepaymentRate:
      typeof l.predictedRepaymentRate === 'number' ? l.predictedRepaymentRate : null,
    rejectionReason: typeof l.rejectionReason === 'string' ? l.rejectionReason : null,
    createdAt: typeof l.createdAt === 'string' ? l.createdAt : new Date(0).toISOString(),
  };
}

function normalizeOpportunityBorrower(raw: unknown): OpportunityBorrowerDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || !o.id) return null;
  const displayName =
    typeof o.displayName === 'string' && o.displayName.trim().length > 0
      ? o.displayName.trim()
      : 'Unknown borrower';
  const eligibility: OpportunityBorrowerDto['eligibility'] =
    o.eligibility === 'eligible' || o.eligibility === 'pre_approved' ? o.eligibility : 'eligible';
  return {
    id: o.id,
    displayName,
    score: numField(o.score, 0),
    eligibility,
    maxAmountNaira: numField(o.maxAmountNaira, 0),
  };
}

function normalizePortfolioMetrics(raw: unknown): BankPortfolioMetricsDto {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_PORTFOLIO };
  const p = raw as Record<string, unknown>;
  return {
    activeCount: numField(p.activeCount, 0),
    atRiskCount: numField(p.atRiskCount, 0),
    disbursedTotalNaira: numField(p.disbursedTotalNaira, 0),
    outstandingTotalNaira: numField(p.outstandingTotalNaira, 0),
    repaymentRate: numField(p.repaymentRate, 0),
    defaultRate: numField(p.defaultRate, 0),
  };
}

/**
 * Coerce `GET /v1/bank/risk-radar` JSON into a safe in-memory shape so the UI
 * never throws on missing keys, wrong types, or partially deployed backends.
 */
export function normalizeRiskRadarResponse(raw: unknown): RiskRadarResponseDto {
  if (!raw || typeof raw !== 'object') {
    return {
      critical: [],
      watchlist: [],
      portfolio: { ...EMPTY_PORTFOLIO },
      opportunity: [],
    };
  }
  const o = raw as Record<string, unknown>;

  const criticalIn = Array.isArray(o.critical) ? o.critical : [];
  const watchIn = Array.isArray(o.watchlist) ? o.watchlist : [];
  const oppIn = Array.isArray(o.opportunity) ? o.opportunity : [];

  return {
    critical: criticalIn.map(normalizeLoanDto).filter((x): x is LoanDto => x !== null),
    watchlist: watchIn.map(normalizeLoanDto).filter((x): x is LoanDto => x !== null),
    portfolio: normalizePortfolioMetrics(o.portfolio),
    opportunity: oppIn
      .map(normalizeOpportunityBorrower)
      .filter((x): x is OpportunityBorrowerDto => x !== null),
  };
}

// ── Risk Radar ──────────────────────────────────────────────────────────────

export async function fetchRiskRadar(): Promise<RiskRadarResponseDto> {
  const raw = await request<unknown>('/v1/bank/risk-radar');
  return normalizeRiskRadarResponse(raw);
}

// ── Loans ───────────────────────────────────────────────────────────────────

/**
 * Coerce `GET /v1/bank/loans` JSON into a safe list + pagination shape.
 */
export function normalizeBankLoansListResponse(
  raw: unknown,
  request: Pick<BankLoansListQuery, 'page' | 'pageSize'> = {},
): BankLoansListResponse {
  const fallbackPage = Math.max(1, Math.floor(numField(request.page, 1)));
  const fallbackPageSize = Math.max(
    1,
    Math.min(100, Math.floor(numField(request.pageSize, 25))),
  );
  if (!raw || typeof raw !== 'object') {
    return {
      data: [],
      pagination: normalizePaginationMeta(undefined, {
        page: fallbackPage,
        pageSize: fallbackPageSize,
      }),
    };
  }
  const o = raw as Record<string, unknown>;
  const dataIn = Array.isArray(o.data) ? o.data : [];
  return {
    data: dataIn
      .map(normalizeLoanDto)
      .filter((row): row is LoanDto => row !== null),
    pagination: normalizePaginationMeta(o.pagination, {
      page: fallbackPage,
      pageSize: fallbackPageSize,
    }),
  };
}

export async function fetchLoans(q?: BankLoansListQuery): Promise<BankLoansListResponse> {
  const query = toQueryString({ ...(q ?? {}) });
  const raw = await request<unknown>('/v1/bank/loans', { query });
  return normalizeBankLoansListResponse(raw, {
    page: q?.page,
    pageSize: q?.pageSize,
  });
}

/** Walk every page of the bank loan list (bounded) for portfolio analytics. */
export async function fetchAllBankLoans(): Promise<LoanDto[]> {
  const PAGE_SIZE = 100;
  const MAX_PAGES = 100;
  const first = await fetchLoans({ page: 1, pageSize: PAGE_SIZE });
  const totalPages = Math.min(
    MAX_PAGES,
    Math.max(1, first?.pagination?.totalPages ?? 1),
  );
  const all: LoanDto[] = [...(first?.data ?? [])];
  for (let p = 2; p <= totalPages; p += 1) {
    const res = await fetchLoans({ page: p, pageSize: PAGE_SIZE });
    all.push(...(res?.data ?? []));
  }
  return all;
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

export async function fetchApplications(
  q?: BankApplicationsListQuery,
): Promise<BankApplicationsListResponse> {
  const query = toQueryString({ ...(q ?? {}) });
  const raw = await request<unknown>('/v1/bank/loan-applications', { query });
  return normalizeBankApplicationsListResponse(raw, {
    page: q?.page,
    pageSize: q?.pageSize,
  });
}

export async function fetchApplicationDetail(id: string): Promise<LoanApplicationDto> {
  const raw = await request<unknown>(
    `/v1/bank/loan-applications/${encodeURIComponent(id)}`,
  );
  const app = normalizeLoanApplicationDto(raw);
  if (!app) {
    throw new ApiError(500, {
      code: 'INTERNAL',
      message: 'The server returned an unexpected application payload.',
    });
  }
  return app;
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
