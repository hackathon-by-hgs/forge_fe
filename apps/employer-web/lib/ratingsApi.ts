/**
 * §27 ratings & reliability — employer side.
 *
 * Endpoints:
 *   GET  /v1/employer/pending-ratings
 *   GET  /v1/employer/ratings?page=&pageSize=
 *   POST /v1/employer/work-sessions/:id/rating   (Idempotency-Key required)
 *
 * Tag vocabulary is fixed and enforced by the server with UNKNOWN_TAG (422)
 * when the FE sends anything outside the set. Mobile worker-side tags exist
 * but are not surfaced here.
 */

import { api } from './api';

// ── Tag vocabulary ─────────────────────────────────────────────────────────

export const EMPLOYER_RATING_TAGS = [
  'punctual',
  'skilled',
  'courteous',
  'hard_working',
  'careful',
  'communicative',
  'would_rehire',
] as const;

export type EmployerRatingTag = (typeof EMPLOYER_RATING_TAGS)[number];

export const EMPLOYER_RATING_TAG_LABEL: Record<EmployerRatingTag, string> = {
  punctual: 'Punctual',
  skilled: 'Skilled',
  courteous: 'Courteous',
  hard_working: 'Hard-working',
  careful: 'Careful',
  communicative: 'Communicative',
  would_rehire: 'Would rehire',
};

// ── Shapes ─────────────────────────────────────────────────────────────────

export interface PendingRatingWorker {
  id: string;
  name: string;
  photoUrl?: string | null;
}

export interface PendingRatingJob {
  id: string;
  title: string;
}

export interface PendingRatingItem {
  sessionId: string;
  job: PendingRatingJob;
  worker: PendingRatingWorker;
  completedAt: string;
}

export interface PendingRatingsResponse {
  items: PendingRatingItem[];
}

export interface ReceivedRatingItem {
  id: string;
  sessionId: string;
  authorRole: 'worker';
  /** The worker who gave the rating. */
  from: { id: string; name: string; photoUrl?: string | null };
  job: { id: string; title: string };
  stars: number;
  tags: string[];
  comment?: string | null;
  submittedAt: string;
}

export interface ReceivedRatingsResponse {
  data: ReceivedRatingItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface SubmitRatingInput {
  stars: number;
  tags?: EmployerRatingTag[];
  comment?: string;
}

export interface SubmittedRating {
  id: string;
  authorRole: 'employer';
  stars: number;
  tags: string[];
  comment?: string | null;
  submittedAt: string;
  visibleToSubject: boolean;
}

export interface SubmitRatingResponse {
  rating: SubmittedRating;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Stable key per (session, employer). Retrying a rating submit (e.g. after a
 * transient 502) must collapse to one BE-side row.
 */
export function ratingIdempotencyKey(sessionId: string, employerId: string): string {
  return `rating:${sessionId}:${employerId}`;
}

// ── Calls ──────────────────────────────────────────────────────────────────

export function getPendingRatings(): Promise<PendingRatingsResponse> {
  return api.get<PendingRatingsResponse>('/v1/employer/pending-ratings');
}

export function listReceivedRatings(query: {
  page?: number;
  pageSize?: number;
}): Promise<ReceivedRatingsResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  const qs = params.toString();
  return api.get<ReceivedRatingsResponse>(
    `/v1/employer/ratings${qs ? `?${qs}` : ''}`,
  );
}

export function submitRating(
  sessionId: string,
  employerId: string,
  input: SubmitRatingInput,
): Promise<SubmitRatingResponse> {
  return api.post<SubmitRatingResponse, SubmitRatingInput>(
    `/v1/employer/work-sessions/${encodeURIComponent(sessionId)}/rating`,
    input,
    { idempotencyKey: ratingIdempotencyKey(sessionId, employerId) },
  );
}
