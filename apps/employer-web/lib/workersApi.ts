/**
 * Employer-scoped Workers API client.
 *
 * Routes under `/v1/employer/workers/*`. Shapes mirror
 * `forge_be/app/src/modules/employer-workers/dto/*`.
 */

import { api } from './api';
import type { JobTypeWire } from './jobsApi';

export type WorkerEligibility = 'ineligible' | 'eligible' | 'pre_approved';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface WorkerSummaryDto {
  id: string;
  fullName: string;
  primarySkill: JobTypeWire;
  photoUrl: string | null;
  homeNeighborhood: string | null;
  reliabilityScore: number;
  averageRating: number;
  jobsCompleted: number;
  onTimeRate: number;
  eligibility: WorkerEligibility;
}

export interface WorkerListResponse {
  data: WorkerSummaryDto[];
  pagination: PaginationMeta;
}

export interface TeamMemberDto extends WorkerSummaryDto {
  jobsWithEmployer: number;
  lastJobAt: string | null;
  explicitlyAdded: boolean;
}

export interface TeamListResponse {
  data: TeamMemberDto[];
  pagination: PaginationMeta;
}

export interface WorkerReviewDto {
  id: string;
  jobId: string;
  employerName: string;
  rating: number;
  body: string;
  createdAt: string;
}

export interface WorkerReliabilitySnapshotDto {
  memberSince: string;
  jobsCompleted: number;
  onTimeRate: number;
  averageWeeklyIncomeNaira: number;
  incomeVolatilityPct: number;
}

export interface WorkerHomeLocation {
  lat: number;
  lng: number;
  address: string | null;
}

export interface WorkerProfileDto extends WorkerSummaryDto {
  joinedAt: string;
  totalEarnedNaira: number;
  averageWeeklyIncomeNaira: number;
  incomeVolatilityPct: number;
  homeLocation: WorkerHomeLocation | null;
  pastJobsWithEmployerCount: number;
  recentReviews: WorkerReviewDto[];
  reliabilitySnapshot: WorkerReliabilitySnapshotDto;
  blocked: boolean;
  onTeam: boolean;
}

export interface WorkerJobItemDto {
  jobId: string;
  title: string;
  type: JobTypeWire;
  scheduledStartAt: string;
  completedAt: string | null;
  payNaira: number;
  status: 'completed' | 'cancelled' | 'in_progress' | 'pending_verification';
}

export interface WorkerJobsResponse {
  data: WorkerJobItemDto[];
  pagination: PaginationMeta;
}

export interface ActiveAssignmentDto {
  sessionId: string;
  worker: WorkerSummaryDto;
  job: {
    id: string;
    title: string;
    type: JobTypeWire;
    lat: number;
    lng: number;
    address: string;
    scheduledStartAt: string;
    startedAt: string;
  };
  elapsedMinutes: number;
  hasPhotoProof: boolean;
  gpsVerification: {
    overall: 'pending' | 'verified' | 'flagged';
    clockInVerified: boolean;
    lastEventDistanceMeters: number | null;
  };
}

export interface ActiveAssignmentsResponse {
  data: ActiveAssignmentDto[];
}

export interface TeamMembershipDto {
  workerId: string;
  employerId: string;
  addedAt: string;
}

export interface BlockDto {
  workerId: string;
  employerId: string;
  blockedAt: string;
  reason: string | null;
}

// ── Filter inputs ───────────────────────────────────────────────────────────

export type TeamSortBy = 'hired' | 'rating' | 'recent';

export interface TeamListQuery {
  sortBy?: TeamSortBy;
  page?: number;
  pageSize?: number;
}

export interface WorkerBrowseQuery {
  skill?: JobTypeWire;
  neighborhood?: string;
  scoreMin?: number;
  scoreMax?: number;
  eligibility?: WorkerEligibility;
  q?: string;
  page?: number;
  pageSize?: number;
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

export function fetchActiveAssignments(): Promise<ActiveAssignmentsResponse> {
  return api.get<ActiveAssignmentsResponse>(
    '/v1/employer/workers/active-assignments',
  );
}

export function fetchTeam(q?: TeamListQuery): Promise<TeamListResponse> {
  return api.get<TeamListResponse>(
    `/v1/employer/workers/team${toQS({ ...(q ?? {}) })}`,
  );
}

export function addTeamMember(workerId: string): Promise<TeamMembershipDto> {
  return api.post<TeamMembershipDto>(
    `/v1/employer/workers/team/${encodeURIComponent(workerId)}`,
  );
}

export function removeTeamMember(workerId: string): Promise<void> {
  return api.del<void>(`/v1/employer/workers/team/${encodeURIComponent(workerId)}`);
}

export function browseWorkers(q?: WorkerBrowseQuery): Promise<WorkerListResponse> {
  return api.get<WorkerListResponse>(
    `/v1/employer/workers${toQS({ ...(q ?? {}) })}`,
  );
}

export function getWorker(id: string): Promise<WorkerProfileDto> {
  return api.get<WorkerProfileDto>(`/v1/employer/workers/${encodeURIComponent(id)}`);
}

export function getWorkerJobs(
  id: string,
  page = 1,
  pageSize = 25,
): Promise<WorkerJobsResponse> {
  const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return api.get<WorkerJobsResponse>(
    `/v1/employer/workers/${encodeURIComponent(id)}/jobs?${p.toString()}`,
  );
}

export function blockWorker(id: string, reason?: string): Promise<BlockDto> {
  return api.post<BlockDto, { reason?: string }>(
    `/v1/employer/workers/${encodeURIComponent(id)}/block`,
    reason ? { reason } : {},
  );
}

export function unblockWorker(id: string): Promise<void> {
  return api.del<void>(`/v1/employer/workers/${encodeURIComponent(id)}/block`);
}
