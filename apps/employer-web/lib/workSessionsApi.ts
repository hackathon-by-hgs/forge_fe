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
  type: JobTypeWire;
  payNaira: number;
  durationHours: number;
  scheduledStartAt: string;
  location: {
    address: string;
    neighborhood?: string | null;
    lat?: number | null;
    lng?: number | null;
  };
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
 * a 502 retry must collapse to a single server-side action. Per spec:
 *   confirm:{session_id}:{employer_id}
 *   dispute:{session_id}:{employer_id}
 */
export function confirmIdempotencyKey(sessionId: string, employerId: string): string {
  return `confirm:${sessionId}:${employerId}`;
}

export function disputeIdempotencyKey(sessionId: string, employerId: string): string {
  return `dispute:${sessionId}:${employerId}`;
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

// ── Calls ──────────────────────────────────────────────────────────────────

export function listReviewQueue(): Promise<WorkSessionsListResponse> {
  return api.get<WorkSessionsListResponse>(
    '/v1/employer/work-sessions?state=auto_review',
  );
}

export function getWorkSession(id: string): Promise<WorkSessionDto> {
  return api.get<WorkSessionDto>(
    `/v1/employer/work-sessions/${encodeURIComponent(id)}`,
  );
}

export function confirmWorkSession(
  id: string,
  employerId: string,
): Promise<WorkSessionDto> {
  return api.post<WorkSessionDto>(
    `/v1/employer/work-sessions/${encodeURIComponent(id)}/confirm`,
    undefined,
    { idempotencyKey: confirmIdempotencyKey(id, employerId) },
  );
}

export function disputeWorkSession(
  id: string,
  employerId: string,
  input: DisputeInput,
): Promise<DisputeResponse> {
  return api.post<DisputeResponse, DisputeInput>(
    `/v1/employer/work-sessions/${encodeURIComponent(id)}/dispute`,
    input,
    { idempotencyKey: disputeIdempotencyKey(id, employerId) },
  );
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
