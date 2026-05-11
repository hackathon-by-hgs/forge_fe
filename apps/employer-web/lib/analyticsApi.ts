/**
 * Employer-scoped Analytics API client.
 *
 * Routes under `/v1/employer/analytics/*`. Shapes mirror
 * `forge_be/app/src/modules/employer-analytics/dto/analytics.dto.ts`.
 *
 * All endpoints accept `?from=&to=` (inclusive `from`, exclusive `to`,
 * ISO 8601). `labor-cost-trend` additionally accepts `?range=7|30|90`.
 */

import { api } from './api';
import type { JobTypeWire } from './jobsApi';

export type AnalyticsRange = '7' | '30' | '90';

export interface AnalyticsRangeQuery {
  from?: string;
  to?: string;
  range?: AnalyticsRange;
}

export interface AnalyticsWindow {
  from: string;
  to: string;
}

// ── labor-cost-trend ────────────────────────────────────────────────────────

export interface LaborCostPoint {
  date: string;
  costNaira: number;
}

export interface LaborCostTrendResponse {
  data: LaborCostPoint[];
  window: AnalyticsWindow;
}

// ── cost-by-job-type ────────────────────────────────────────────────────────

export interface CostByJobTypePoint {
  type: JobTypeWire;
  label: string;
  valueNaira: number;
  share: number;
}

export interface CostByJobTypeResponse {
  data: CostByJobTypePoint[];
  window: AnalyticsWindow;
}

// ── worker-utilization ──────────────────────────────────────────────────────

export interface WorkerUtilizationItem {
  workerId: string;
  name: string;
  jobs: number;
  earnedNaira: number;
}

export interface WorkerUtilizationResponse {
  data: WorkerUtilizationItem[];
  window: AnalyticsWindow;
}

// ── time-to-fill ────────────────────────────────────────────────────────────

export interface TimeToFillPoint {
  weekStartDate: string;
  averageMinutes: number;
  jobs: number;
}

export interface TimeToFillResponse {
  data: TimeToFillPoint[];
  window: AnalyticsWindow;
}

// ── demand-heatmap ──────────────────────────────────────────────────────────

export interface DemandHeatmapCell {
  dayOfWeek: number;
  hour: number;
  jobs: number;
}

export interface DemandHeatmapResponse {
  data: DemandHeatmapCell[];
  window: AnalyticsWindow;
}

// ── roi-by-type ─────────────────────────────────────────────────────────────

export interface RoiByTypeItem {
  type: JobTypeWire;
  label: string;
  jobs: number;
  avgCostNaira: number;
  avgFillTimeMinutes: number;
  completionRate: number;
}

export interface RoiByTypeResponse {
  data: RoiByTypeItem[];
  window: AnalyticsWindow;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function toQS(obj: Record<string, unknown>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

// ── Calls ───────────────────────────────────────────────────────────────────

export function getLaborCostTrend(
  q?: AnalyticsRangeQuery,
): Promise<LaborCostTrendResponse> {
  return api.get<LaborCostTrendResponse>(
    `/v1/employer/analytics/labor-cost-trend${toQS({ ...(q ?? {}) })}`,
  );
}

export function getCostByJobType(
  q?: AnalyticsRangeQuery,
): Promise<CostByJobTypeResponse> {
  return api.get<CostByJobTypeResponse>(
    `/v1/employer/analytics/cost-by-job-type${toQS({ ...(q ?? {}) })}`,
  );
}

export function getWorkerUtilization(
  q?: AnalyticsRangeQuery,
): Promise<WorkerUtilizationResponse> {
  return api.get<WorkerUtilizationResponse>(
    `/v1/employer/analytics/worker-utilization${toQS({ ...(q ?? {}) })}`,
  );
}

export function getTimeToFill(
  q?: AnalyticsRangeQuery,
): Promise<TimeToFillResponse> {
  return api.get<TimeToFillResponse>(
    `/v1/employer/analytics/time-to-fill${toQS({ ...(q ?? {}) })}`,
  );
}

export function getDemandHeatmap(
  q?: AnalyticsRangeQuery,
): Promise<DemandHeatmapResponse> {
  return api.get<DemandHeatmapResponse>(
    `/v1/employer/analytics/demand-heatmap${toQS({ ...(q ?? {}) })}`,
  );
}

export function getRoiByType(
  q?: AnalyticsRangeQuery,
): Promise<RoiByTypeResponse> {
  return api.get<RoiByTypeResponse>(
    `/v1/employer/analytics/roi-by-type${toQS({ ...(q ?? {}) })}`,
  );
}
