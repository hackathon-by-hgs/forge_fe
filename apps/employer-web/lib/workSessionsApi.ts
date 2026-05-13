/**
 * Employer-scoped Work Sessions API client. §11.7 introduces a 2-hour
 * employer review window between worker clock-out and payout disbursement.
 *
 * Endpoints (BE):
 *   GET  /v1/employer/work-sessions?state=auto_review
 *   GET  /v1/employer/work-sessions/{id}
 *   POST /v1/employer/work-sessions/{id}/confirm     (Idempotency-Key required)
 *   POST /v1/employer/work-sessions/{id}/dispute     (Idempotency-Key required)
 */

import { api } from './api';
import type { JobTypeWire } from './jobsApi';

// ── Enums ──────────────────────────────────────────────────────────────────

export type VerificationState =
  | 'auto_review'
  | 'employer_confirmed'
  | 'auto_released'
  | 'disputed';

export type DisputeReason =
  | 'no_show'
  | 'left_early'
  | 'poor_quality'
  | 'wrong_person'
  | 'other';

export type DisputeStatus = 'open' | 'resolved' | 'withdrawn';

// ── Shapes ─────────────────────────────────────────────────────────────────

export interface WorkSessionWorker {
  id: string;
  fullName: string;
  photoUrl?: string | null;
  primarySkill?: JobTypeWire | null;
}

export interface WorkSessionJobSummary {
  id: string;
  title: string;
  type?: JobTypeWire | null;
  payNaira?: number | null;
  /**
   * BE doesn't currently hydrate scheduledStartAt / durationHours on the
   * session payload — the canonical values live on the parent Job. Treat
   * both as optional so the render layer can hide the schedule line.
   */
  durationHours?: number | null;
  scheduledStartAt?: string | null;
  /**
   * BE may omit `location` (or send it as null) on the work-session payload
   * — the canonical location lives on the parent Job. Treat as optional so
   * every access requires `?.` and we never crash on partial responses.
   */
  location?: {
    address?: string | null;
    neighborhood?: string | null;
    lat?: number | null;
    lng?: number | null;
  } | null;
}

export interface ClockEventInfo {
  at: string;
  gps: { lat: number; lng: number };
  gpsAccuracyMeters: number;
  verified: boolean;
}

export interface DisputeRow {
  id: string;
  status: DisputeStatus;
  reason: DisputeReason;
  description?: string | null;
  evidenceUploadIds?: string[] | null;
  openedAt: string;
  resolvedAt?: string | null;
}

export interface WorkSessionDto {
  id: string;
  jobId: string;
  applicationId: string;
  workerId: string;
  worker: WorkSessionWorker;
  job: WorkSessionJobSummary;
  verificationState: VerificationState;
  /** Total payout the employer will release if they confirm or do nothing. */
  payAmountPendingNaira: number;
  /** Naira actually disbursed once verification_state ∈ {employer_confirmed, auto_released}. */
  payAmountDisbursedNaira: number;
  /** Wall-clock instant at which the auto-release cron will release the hold. */
  holdReleaseAt: string;
  /** ISO timestamp when the employer reviewer last acted; null until then. */
  employerReviewedAt?: string | null;
  clockInAt: string;
  clockOutAt?: string | null;
  clockIn?: ClockEventInfo | null;
  clockOut?: ClockEventInfo | null;
  proofPhotoUrl?: string | null;
  workerNote?: string | null;
  durationHoursWorked?: number | null;
  /** Set once a confirm/auto-release fires a payout transaction. */
  transactionId?: string | null;
  /** Dispute row attached if verification_state === 'disputed'. */
  dispute?: DisputeRow | null;
}

export interface WorkSessionsListResponse {
  data: WorkSessionDto[];
  /** Optional pagination; BE may return a flat list for the review queue. */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface DisputeInput {
  reason: DisputeReason;
  description?: string;
  evidence_upload_ids?: string[];
}

export interface DisputeResponse {
  session: WorkSessionDto;
  dispute: DisputeRow;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Idempotency keys are stable across retries — re-clicking Confirm or hitting
 * a 502 retry must collapse to a single server-side action.
 *
 * The brief proposed `confirm:{session_id}:{employer_id}` and
 * `dispute:{session_id}:{employer_id}`, but the BE header validator only
 * accepts `[a-zA-Z0-9-]{8,128}` — colons and underscores both bounce. Session
 * and employer IDs use the `ses_…` / `emp_…` prefix convention, so even
 * relaxing `:` alone wouldn't fix it. We hyphen-encode all separators here so
 * the resulting key is always regex-valid AND still deterministic per
 * (session, employer): the same inputs produce the same key on every retry.
 */
function sanitizeForIdempotencyKey(s: string): string {
  return s.replace(/[^a-zA-Z0-9-]/g, '-');
}

export function confirmIdempotencyKey(sessionId: string, employerId: string): string {
  return `confirm-${sanitizeForIdempotencyKey(sessionId)}-${sanitizeForIdempotencyKey(employerId)}`;
}

export function disputeIdempotencyKey(sessionId: string, employerId: string): string {
  return `dispute-${sanitizeForIdempotencyKey(sessionId)}-${sanitizeForIdempotencyKey(employerId)}`;
}

export const DISPUTE_REASONS: ReadonlyArray<{ value: DisputeReason; label: string }> = [
  { value: 'no_show', label: 'Worker did not show up' },
  { value: 'left_early', label: 'Worker left before the shift ended' },
  { value: 'poor_quality', label: 'Work quality was unacceptable' },
  { value: 'wrong_person', label: 'Wrong person clocked in' },
  { value: 'other', label: 'Other (describe below)' },
];

export const DISPUTE_REASON_LABEL: Record<DisputeReason, string> = Object.fromEntries(
  DISPUTE_REASONS.map((r) => [r.value, r.label]),
) as Record<DisputeReason, string>;

export const VERIFICATION_STATE_LABEL: Record<VerificationState, string> = {
  auto_review: 'Awaiting review',
  employer_confirmed: 'Confirmed',
  auto_released: 'Auto-released',
  disputed: 'Disputed',
};

// ── Normalization ──────────────────────────────────────────────────────────

/**
 * Coerce a raw BE worker object into our `WorkSessionWorker` shape. The BE
 * has historically used both `fullName` (employer-jobs payloads) and `name`
 * (§27 pending-ratings inbox) for the same field — fall back gracefully so
 * neither breaks the dashboard. Treats null/undefined name as "Worker".
 */
function normalizeWorker(raw: unknown): WorkSessionWorker {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const pickString = (...keys: string[]): string | null => {
    for (const k of keys) {
      const v = r[k];
      if (typeof v === 'string' && v.trim().length > 0) return v;
    }
    return null;
  };
  return {
    id: pickString('id') ?? 'unknown',
    fullName: pickString('fullName', 'name', 'full_name') ?? 'Worker',
    photoUrl: pickString('photoUrl', 'photo_url'),
    primarySkill:
      (pickString('primarySkill', 'primary_skill') as JobTypeWire | null) ?? null,
  };
}

function normalizeJobSummary(raw: unknown): WorkSessionJobSummary {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const locRaw = r.location;
  const loc = (locRaw && typeof locRaw === 'object'
    ? (locRaw as Record<string, unknown>)
    : null);
  return {
    id: typeof r.id === 'string' ? r.id : '',
    title: typeof r.title === 'string' ? r.title : 'Untitled job',
    type: (typeof r.type === 'string' ? r.type : null) as JobTypeWire | null,
    payNaira: typeof r.payNaira === 'number' ? r.payNaira : null,
    durationHours: typeof r.durationHours === 'number' ? r.durationHours : null,
    scheduledStartAt:
      typeof r.scheduledStartAt === 'string' ? r.scheduledStartAt : null,
    location: loc
      ? {
          address: typeof loc.address === 'string' ? loc.address : null,
          neighborhood:
            typeof loc.neighborhood === 'string' ? loc.neighborhood : null,
          lat: typeof loc.lat === 'number' ? loc.lat : null,
          lng: typeof loc.lng === 'number' ? loc.lng : null,
        }
      : null,
  };
}

function normalizeWorkSession(raw: unknown): WorkSessionDto {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  // Pass through every BE-supplied scalar verbatim (status, timestamps,
  // amounts, transactionId, etc.) and only re-shape the two nested objects
  // that have proven to drift between BE payloads.
  return {
    ...(r as unknown as WorkSessionDto),
    worker: normalizeWorker(r.worker),
    job: normalizeJobSummary(r.job),
  };
}

// ── Calls ──────────────────────────────────────────────────────────────────

export async function listReviewQueue(): Promise<WorkSessionsListResponse> {
  const raw = await api.get<WorkSessionsListResponse>(
    '/v1/employer/work-sessions?state=auto_review',
  );
  return {
    ...raw,
    data: Array.isArray(raw?.data) ? raw.data.map(normalizeWorkSession) : [],
  };
}

export async function getWorkSession(id: string): Promise<WorkSessionDto> {
  const raw = await api.get<WorkSessionDto>(
    `/v1/employer/work-sessions/${encodeURIComponent(id)}`,
  );
  return normalizeWorkSession(raw);
}

export async function confirmWorkSession(
  id: string,
  employerId: string,
): Promise<WorkSessionDto> {
  const raw = await api.post<WorkSessionDto>(
    `/v1/employer/work-sessions/${encodeURIComponent(id)}/confirm`,
    undefined,
    { idempotencyKey: confirmIdempotencyKey(id, employerId) },
  );
  return normalizeWorkSession(raw);
}

export async function disputeWorkSession(
  id: string,
  employerId: string,
  input: DisputeInput,
): Promise<DisputeResponse> {
  const raw = await api.post<DisputeResponse, DisputeInput>(
    `/v1/employer/work-sessions/${encodeURIComponent(id)}/dispute`,
    input,
    { idempotencyKey: disputeIdempotencyKey(id, employerId) },
  );
  return {
    ...raw,
    session: normalizeWorkSession(raw?.session),
  };
}

/**
 * `verification_state === 'auto_review'` is the canonical "buttons enabled"
 * check. Per brief: if hold_release_at has already passed AND the state is
 * still auto_review, the cron is mid-tick — disable buttons and refetch.
 */
export function canActOnSession(s: WorkSessionDto, nowMs = Date.now()): boolean {
  if (s.verificationState !== 'auto_review') return false;
  const holdMs = new Date(s.holdReleaseAt).getTime();
  if (!Number.isFinite(holdMs)) return true;
  return holdMs > nowMs;
}

export function isCronTicking(s: WorkSessionDto, nowMs = Date.now()): boolean {
  if (s.verificationState !== 'auto_review') return false;
  const holdMs = new Date(s.holdReleaseAt).getTime();
  return Number.isFinite(holdMs) && holdMs <= nowMs;
}

/**
 * State considered "settled" — payout has fired and the FE should hide the
 * buttons regardless of pay_amount_disbursed (which may lag the state flip).
 */
export function isSettled(s: WorkSessionDto): boolean {
  return (
    s.verificationState === 'employer_confirmed' ||
    s.verificationState === 'auto_released' ||
    s.verificationState === 'disputed'
  );
}
