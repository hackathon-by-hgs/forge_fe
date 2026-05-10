/**
 * Bank dashboard composite payloads.
 *
 * `GET /v1/bank/risk-radar` is Phase 4 per FRONTEND_INTEGRATION.md §5.8 — it is not
 * yet in `/v1/openapi.json`. Regenerate `packages/types/src/api.gen.ts` when it
 * lands and replace these aliases with `components['schemas'][…]` from the spec.
 */

export interface BankRiskRadarCriticalItemDto {
  loanId: string;
  borrowerName?: string;
  outstandingNaira?: number;
  riskLevel?: string;
  headline?: string;
}

export interface BankRiskRadarWatchItemDto {
  loanId: string;
  borrowerName?: string;
  outstandingNaira?: number;
  detail?: string;
}

export interface BankRiskRadarMetricsDto {
  activeLoansCount?: number;
  activeLoansOutstandingNaira?: number;
  totalDisbursedNaira?: number;
  repaymentRate?: number;
  defaultRate?: number;
  /** Sparkline samples for MetricTile */
  activeLoansTrend?: number[];
  disbursedTrend?: number[];
  repaymentTrend?: number[];
  defaultTrend?: number[];
}

export interface BankRiskRadarOpportunityDto {
  id: string;
  fullName?: string;
  reliabilityScore?: number;
  jobsCompleted?: number;
}

/** Intended shape for `GET /v1/bank/risk-radar` — fields optional until BE stabilizes. */
export interface BankRiskRadarDto {
  metrics?: BankRiskRadarMetricsDto;
  criticalAlerts?: BankRiskRadarCriticalItemDto[];
  watchList?: BankRiskRadarWatchItemDto[];
  opportunity?: BankRiskRadarOpportunityDto[];
}
