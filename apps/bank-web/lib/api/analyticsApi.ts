/**
 * Bank analytics API client (Part B of the underwriting+attribution brief).
 *
 * Routes live under `/v1/bank/analytics/*`. All shapes mirror
 * `forge_be/app/src/modules/bank/dto/analytics.dto.ts`. The BE math mirrors
 * the formulas in the spec (and the prior client-side derivation in
 * `app/(app)/performance/page.tsx`), so the page renders identically
 * when we swap mock for live.
 */

import { request } from './client';

// ── Shared shapes ──────────────────────────────────────────────────────────

export type AnalyticsWindowDays = 30 | 60 | 90;

export interface AnalyticsWindow {
  from: string;
  to: string;
  days: AnalyticsWindowDays;
}

export interface PeriodMetricsDto {
  count: number;
  principalDisbursedNaira: number;
  repaymentRate: number;
  defaultRate: number;
  netYield: number;
  avgScoreAtApproval: number;
  avgTermMonths: number;
  workerShare: number;
}

export interface PeriodKpiResponseDto {
  window: AnalyticsWindow;
  prior: AnalyticsWindow;
  current: PeriodMetricsDto;
  priorMetrics: PeriodMetricsDto;
  deltaBps: {
    repaymentRate: number;
    defaultRate: number;
    netYield: number;
  };
}

export type AttributionFactorKey =
  | 'borrower_mix'
  | 'approval_gate'
  | 'tenure'
  | 'borrower_type_mix'
  | 'residual';

export interface AttributionFactorDto {
  key: AttributionFactorKey;
  label: string;
  bps: number;
  detail: string;
}

export interface AttributionResponseDto {
  window: AnalyticsWindow;
  totalDeltaBps: number;
  factors: AttributionFactorDto[];
}

export type ScoreBandLabel = '90–100' | '80–89' | '70–79' | '60–69';

export interface ScoreBandCohortDto {
  label: ScoreBandLabel;
  min: number;
  max: number;
  count: number;
  principalNaira: number;
  defaultedCount: number;
  repaidCount: number;
  defaultRate: number;
}

export interface BorrowerTypeCohortDto {
  type: 'worker' | 'business';
  count: number;
  principalNaira: number;
  defaultRate: number;
}

export interface StatusBreakdownDto {
  status: string;
  count: number;
  principalNaira: number;
  share: number;
}

export interface CohortResponseDto {
  window: AnalyticsWindow;
  byScoreBand: ScoreBandCohortDto[];
  byBorrowerType: BorrowerTypeCohortDto[];
  statusBreakdown: StatusBreakdownDto[];
}

/**
 * Each row is `{ monthsSince, [cohortKey]: lossRate }`. Cohorts with no
 * loans are omitted from both `cohorts` and each row's keys so the chart
 * can hide their line.
 */
export interface VintageRowDto {
  monthsSince: number;
  [cohortKey: string]: number;
}

export interface VintageCurvesResponseDto {
  cohorts: string[];
  rows: VintageRowDto[];
}

// ── Calls ──────────────────────────────────────────────────────────────────

interface PeriodQuery {
  window: AnalyticsWindowDays;
  asOf?: string;
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    usp.set(k, String(v));
  }
  return usp.toString();
}

export function fetchAnalyticsPeriod(
  q: PeriodQuery,
): Promise<PeriodKpiResponseDto> {
  return request<PeriodKpiResponseDto>('/v1/bank/analytics/period', {
    query: toQuery({ window: q.window, asOf: q.asOf }),
  });
}

export function fetchAnalyticsAttribution(
  q: PeriodQuery,
): Promise<AttributionResponseDto> {
  return request<AttributionResponseDto>('/v1/bank/analytics/attribution', {
    query: toQuery({ window: q.window, asOf: q.asOf }),
  });
}

export function fetchAnalyticsCohorts(
  q: PeriodQuery,
): Promise<CohortResponseDto> {
  return request<CohortResponseDto>('/v1/bank/analytics/cohorts', {
    query: toQuery({ window: q.window, asOf: q.asOf }),
  });
}

interface VintageQuery {
  horizonMonths?: number;
  cohorts?: number;
  granularity?: 'quarter' | 'month';
}

export function fetchAnalyticsVintageCurves(
  q?: VintageQuery,
): Promise<VintageCurvesResponseDto> {
  return request<VintageCurvesResponseDto>(
    '/v1/bank/analytics/vintage-curves',
    {
      query: toQuery({
        horizonMonths: q?.horizonMonths,
        cohorts: q?.cohorts,
        granularity: q?.granularity,
      }),
    },
  );
}
