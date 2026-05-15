/**
 * Employer-scoped Jobs API client. Phase 2 endpoints under `/v1/employer/jobs/*`.
 *
 * Shapes mirror `forge_be/app/src/modules/employer-jobs/dto/*`. `assignedWorker`
 * is now hydrated on every JobDto path (BE punch-list reply §1).
 */

import { ApiError, api, getAccessToken, getApiBaseUrl, parseResponseError } from './api';

// ── Shared enums ────────────────────────────────────────────────────────────

export type JobStatusWire =
  | 'draft'
  | 'open'
  | 'applications_in'
  | 'accepted'
  | 'in_progress'
  | 'pending_verification'
  | 'completed'
  | 'cancelled';

export type JobTypeWire = 'loader' | 'driver' | 'unloader' | 'general';
export type JobAudience = 'public' | 'team_first';
export type ApplicationStatusWire = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type JobsSortBy = 'postedAt' | 'scheduledStartAt' | 'payNaira';
export type SortDir = 'asc' | 'desc';

// ── Response shapes ─────────────────────────────────────────────────────────

export interface JobLocation {
  lat: number;
  lng: number;
  address: string;
  neighborhood?: string | null;
}

export interface AssignedWorkerSummary {
  id: string;
  fullName: string;
  photoUrl?: string | null;
  primarySkill: JobTypeWire;
}

export interface JobDto {
  id: string;
  employerId: string;
  type: JobTypeWire;
  title: string;
  description: string;
  payNaira: number;
  durationHours: number;
  location: JobLocation;
  geofenceRadiusMeters: number;
  status: JobStatusWire;
  audience: JobAudience;
  audienceFlippedAt?: string | null;
  postedAt: string;
  scheduledStartAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  applicationsCount: number;
  assignedWorkerId?: string | null;
  /** Hydrated worker summary. Null until acceptance. */
  assignedWorker?: AssignedWorkerSummary | null;
  cancelledReason?: string | null;
  requiredEquipment: string[];
  /**
   * Multi-worker slots. Always present on the wire — 1 means single-worker
   * (legacy behaviour, `/accept` endpoint). >1 means multi-worker
   * (`/accept-slot` endpoint, escrow = payNaira × maxWorkers).
   */
  maxWorkers: number;
  /** Slots already filled. Bumps on every successful accept-slot. */
  acceptedCount: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface JobsListResponse {
  data: JobDto[];
  pagination: PaginationMeta;
}

export interface ActiveJobsResponse {
  data: JobDto[];
}

export interface JobTemplate {
  id: string;
  title: string;
  type: JobTypeWire;
  payNaira: number;
  durationHours: number;
  location: JobLocation;
  requiredEquipment: string[];
  lastUsedAt: string;
}

export interface JobTemplatesResponse {
  data: JobTemplate[];
}

export interface JobTimelineEventDto {
  id: string;
  kind: string;
  actorId: string;
  actorType: 'worker' | 'employer' | 'system';
  payload?: Record<string, unknown>;
  occurredAt: string;
}

export interface JobTimelineResponse {
  data: JobTimelineEventDto[];
}

export interface ApplicationWorkerDto {
  id: string;
  fullName: string;
  primarySkill: JobTypeWire;
  photoUrl?: string | null;
  reliabilityScore: number;
  averageRating: number;
  jobsCompleted: number;
}

export interface JobApplicationItemDto {
  id: string;
  jobId: string;
  workerId: string;
  status: ApplicationStatusWire;
  appliedAt: string;
  decidedAt?: string | null;
  withdrawnAt?: string | null;
  distanceMeters?: number | null;
  note?: string | null;
  worker: ApplicationWorkerDto;
  rankScore: number;
}

export interface JobApplicationsResponse {
  data: JobApplicationItemDto[];
  total: number;
}

export interface GpsPoint {
  lat: number;
  lng: number;
}

export interface ClockEventItem {
  id: string;
  kind: 'clock_in' | 'clock_out';
  at: string;
  gps: GpsPoint;
  gpsAccuracyMeters: number;
  verified: boolean;
}

export interface PhotoProofItem {
  id: string;
  workerId: string;
  at: string;
  url: string;
  exif: { lat: number | null; lng: number | null; takenAt: string | null };
}

export interface GpsVerification {
  clockInVerified: boolean;
  clockOutVerified: boolean;
  overall: 'verified' | 'flagged' | 'pending';
  lastEventDistanceMeters?: number | null;
}

export interface JobProofResponse {
  photos: PhotoProofItem[];
  clockEvents: ClockEventItem[];
  gpsVerification: GpsVerification;
}

// InvoiceDto + InvoiceLineItem are shared with paymentsApi.
export type { InvoiceDto, InvoiceLineItemDto as InvoiceLineItem } from './paymentsApi';

// ── Request shapes ──────────────────────────────────────────────────────────

export interface JobsListQuery {
  status?: JobStatusWire[];
  type?: JobTypeWire;
  neighborhood?: string;
  q?: string;
  from?: string;
  to?: string;
  sortBy?: JobsSortBy;
  sortDir?: SortDir;
  page?: number;
  pageSize?: number;
}

export interface JobLocationInput {
  lat: number;
  lng: number;
  address: string;
  neighborhood?: string;
}

export interface CreateJobInput {
  title: string;
  description: string;
  type: JobTypeWire;
  payNaira: number;
  durationHours: number;
  location: JobLocationInput;
  geofenceRadiusMeters?: number;
  audience: JobAudience;
  scheduledStartAt: string;
  requiredEquipment?: string[];
  postNow: boolean;
  /**
   * Number of workers to hire (1–20). Omit or send 1 to use the legacy
   * single-worker code path (regular `/accept`, full pay reserved once).
   */
  maxWorkers?: number;
}

export type UpdateJobInput = Partial<Omit<CreateJobInput, 'postNow'>>;

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildJobsQuery(q: JobsListQuery | undefined): string {
  if (!q) return '';
  const params = new URLSearchParams();
  if (q.status && q.status.length) {
    for (const s of q.status) params.append('status', s);
  }
  if (q.type) params.set('type', q.type);
  if (q.neighborhood) params.set('neighborhood', q.neighborhood);
  if (q.q) params.set('q', q.q);
  if (q.from) params.set('from', q.from);
  if (q.to) params.set('to', q.to);
  if (q.sortBy) params.set('sortBy', q.sortBy);
  if (q.sortDir) params.set('sortDir', q.sortDir);
  if (q.page) params.set('page', String(q.page));
  if (q.pageSize) params.set('pageSize', String(q.pageSize));
  const s = params.toString();
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

// ── Calls ───────────────────────────────────────────────────────────────────

export function listJobs(query?: JobsListQuery): Promise<JobsListResponse> {
  return api.get<JobsListResponse>(`/v1/employer/jobs${buildJobsQuery(query)}`);
}

export function listActiveJobs(): Promise<ActiveJobsResponse> {
  return api.get<ActiveJobsResponse>('/v1/employer/jobs/active');
}

export function listRecentTemplates(): Promise<JobTemplatesResponse> {
  return api.get<JobTemplatesResponse>('/v1/employer/jobs/recent-templates');
}

export function getJob(id: string): Promise<JobDto> {
  return api.get<JobDto>(`/v1/employer/jobs/${encodeURIComponent(id)}`);
}

export function getJobTimeline(id: string): Promise<JobTimelineResponse> {
  return api.get<JobTimelineResponse>(
    `/v1/employer/jobs/${encodeURIComponent(id)}/timeline`,
  );
}

export function getJobApplications(id: string): Promise<JobApplicationsResponse> {
  return api.get<JobApplicationsResponse>(
    `/v1/employer/jobs/${encodeURIComponent(id)}/applications`,
  );
}

export function getJobProof(id: string): Promise<JobProofResponse> {
  return api.get<JobProofResponse>(
    `/v1/employer/jobs/${encodeURIComponent(id)}/proof`,
  );
}

export function createJob(
  input: CreateJobInput,
  options?: { idempotencyKey?: string },
): Promise<JobDto> {
  return api.post<JobDto, CreateJobInput>('/v1/employer/jobs', input, {
    // Caller supplies a stable key when it needs the BE to dedupe a retry —
    // §27 rating gate retries the same POST with the same key after clearing
    // the unrated backlog, so a fresh UUID would defeat dedup.
    idempotencyKey: options?.idempotencyKey ?? genUuid(),
  });
}

export function updateJob(id: string, input: UpdateJobInput): Promise<JobDto> {
  return api.patch<JobDto, UpdateJobInput>(
    `/v1/employer/jobs/${encodeURIComponent(id)}`,
    input,
  );
}

export function publishJob(id: string): Promise<JobDto> {
  return api.post<JobDto>(`/v1/employer/jobs/${encodeURIComponent(id)}/publish`);
}

export function cancelJob(id: string, reason?: string): Promise<JobDto> {
  return api.post<JobDto, { reason?: string }>(
    `/v1/employer/jobs/${encodeURIComponent(id)}/cancel`,
    reason ? { reason } : {},
  );
}

export function acceptApplication(
  jobId: string,
  appId: string,
): Promise<JobApplicationItemDto> {
  return api.post<JobApplicationItemDto>(
    `/v1/employer/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(appId)}/accept`,
  );
}

/**
 * Multi-worker accept. Use only when `job.maxWorkers > 1` — the BE returns
 * 409 INVALID_STATE if called on a single-worker job. Each successful call
 * bumps `acceptedCount` by 1; the final slot atomically auto-rejects any
 * sibling pending applications.
 */
export function acceptApplicationSlot(
  jobId: string,
  appId: string,
): Promise<JobApplicationItemDto> {
  return api.post<JobApplicationItemDto>(
    `/v1/employer/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(appId)}/accept-slot`,
  );
}

export function rejectApplication(
  jobId: string,
  appId: string,
): Promise<JobApplicationItemDto> {
  return api.post<JobApplicationItemDto>(
    `/v1/employer/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(appId)}/reject`,
  );
}

// Returns the canonical InvoiceDto shared with paymentsApi.
import type { InvoiceDto as _InvoiceDto } from './paymentsApi';
export function generateJobInvoice(
  id: string,
  body: { dueAt?: string } = {},
): Promise<_InvoiceDto> {
  return api.post<_InvoiceDto, { dueAt?: string }>(
    `/v1/employer/jobs/${encodeURIComponent(id)}/invoice`,
    body,
    { idempotencyKey: genUuid() },
  );
}

// ── CSV export ──────────────────────────────────────────────────────────────

export async function downloadJobsCsv(query?: JobsListQuery): Promise<void> {
  const url = `${getApiBaseUrl()}/v1/employer/jobs/export.csv${buildJobsQuery(query)}`;
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
  const filename = match?.[1] ?? `jobs-${new Date().toISOString().slice(0, 10)}.csv`;

  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}
