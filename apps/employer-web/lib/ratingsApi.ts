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
 * transient 502) must collapse to one BE-side row. The BE validator only
 * accepts `[a-zA-Z0-9-]{8,128}`, so we hyphen-encode separators in the IDs
 * (which carry `_` natively, e.g. `ses_xxx` / `emp_xxx`) — the encoding is
 * deterministic so the same inputs still produce the same key on every retry.
 */
function sanitizeForIdempotencyKey(s: string): string {
  return s.replace(/[^a-zA-Z0-9-]/g, '-');
}

export function ratingIdempotencyKey(sessionId: string, employerId: string): string {
  return `rating-${sanitizeForIdempotencyKey(sessionId)}-${sanitizeForIdempotencyKey(employerId)}`;
}

// ── Normalization ──────────────────────────────────────────────────────────

/**
 * The ratings module on the BE ships snake_case (`session_id`, `completed_at`,
 * `author_role`, `visible_to_subject`, `photo_url`). The rest of the FE
 * codebase is camelCase end-to-end, so we normalize at the API boundary
 * rather than scattering snake/camel branches through render code. The
 * normalizers read both casings (snake preferred per BE audit, camel as
 * fallback in case BE flips later or adds a global transform).
 */
function isObj(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === 'object' && !Array.isArray(raw);
}

function pickString(o: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return null;
}

function pickNumber(o: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return null;
}

function pickBool(o: Record<string, unknown>, ...keys: string[]): boolean | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'boolean') return v;
  }
  return null;
}

function normalizePendingWorker(raw: unknown): PendingRatingWorker {
  if (!isObj(raw)) return { id: 'unknown', name: 'Worker', photoUrl: null };
  return {
    id: pickString(raw, 'id') ?? 'unknown',
    name: pickString(raw, 'name', 'fullName', 'full_name') ?? 'Worker',
    photoUrl: pickString(raw, 'photoUrl', 'photo_url'),
  };
}

function normalizePendingJob(raw: unknown): PendingRatingJob {
  if (!isObj(raw)) return { id: '', title: 'Untitled job' };
  return {
    id: pickString(raw, 'id') ?? '',
    title: pickString(raw, 'title') ?? 'Untitled job',
  };
}

function normalizePendingRatingItem(raw: unknown): PendingRatingItem | null {
  if (!isObj(raw)) return null;
  const sessionId = pickString(raw, 'sessionId', 'session_id');
  if (!sessionId) return null;
  return {
    sessionId,
    completedAt:
      pickString(raw, 'completedAt', 'completed_at') ?? new Date(0).toISOString(),
    worker: normalizePendingWorker(raw.worker),
    job: normalizePendingJob(raw.job),
  };
}

function normalizeReceivedFrom(raw: unknown): ReceivedRatingItem['from'] {
  if (!isObj(raw)) return { id: 'unknown', name: 'Unknown', photoUrl: null };
  return {
    id: pickString(raw, 'id') ?? 'unknown',
    name: pickString(raw, 'name', 'fullName', 'full_name') ?? 'Unknown',
    photoUrl: pickString(raw, 'photoUrl', 'photo_url'),
  };
}

function normalizeReceivedRating(raw: unknown): ReceivedRatingItem | null {
  if (!isObj(raw)) return null;
  const id = pickString(raw, 'id');
  if (!id) return null;
  // `author_role` is the spec field; `kind` is the legacy duplicate the BE
  // kept for backward compat (per the audit). Read either.
  const fromObj = isObj(raw.from) ? raw.from : {};
  const authorRoleFromTop = pickString(raw, 'authorRole', 'author_role');
  const authorRoleFromFrom = pickString(fromObj, 'kind', 'authorRole', 'author_role');
  const authorRole =
    authorRoleFromTop === 'worker' || authorRoleFromFrom === 'worker'
      ? 'worker'
      : 'worker'; // employer→worker ratings never surface here; default safe.
  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((t): t is string => typeof t === 'string')
    : [];
  return {
    id,
    sessionId: pickString(raw, 'sessionId', 'session_id') ?? '',
    authorRole,
    from: normalizeReceivedFrom(raw.from),
    job: normalizePendingJob(raw.job),
    stars: pickNumber(raw, 'stars') ?? 0,
    tags,
    comment: pickString(raw, 'comment'),
    submittedAt:
      pickString(raw, 'submittedAt', 'submitted_at') ?? new Date(0).toISOString(),
  };
}

function normalizePagination(raw: unknown, fallbackPage: number, fallbackPageSize: number) {
  if (!isObj(raw)) {
    return { page: fallbackPage, pageSize: fallbackPageSize, total: 0, totalPages: 1 };
  }
  const pageSize =
    pickNumber(raw, 'pageSize', 'page_size') ?? fallbackPageSize;
  const total = pickNumber(raw, 'total') ?? 0;
  const totalPages =
    pickNumber(raw, 'totalPages', 'total_pages') ??
    Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const page = pickNumber(raw, 'page') ?? fallbackPage;
  return { page, pageSize, total, totalPages };
}

function normalizeSubmittedRating(raw: unknown): SubmittedRating | null {
  if (!isObj(raw)) return null;
  const id = pickString(raw, 'id');
  if (!id) return null;
  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((t): t is string => typeof t === 'string')
    : [];
  return {
    id,
    authorRole: 'employer',
    stars: pickNumber(raw, 'stars') ?? 0,
    tags,
    comment: pickString(raw, 'comment'),
    submittedAt:
      pickString(raw, 'submittedAt', 'submitted_at') ?? new Date().toISOString(),
    visibleToSubject:
      pickBool(raw, 'visibleToSubject', 'visible_to_subject') ?? false,
  };
}

// ── Calls ──────────────────────────────────────────────────────────────────

export async function getPendingRatings(): Promise<PendingRatingsResponse> {
  const raw = await api.get<unknown>('/v1/employer/pending-ratings');
  const itemsRaw =
    isObj(raw) && Array.isArray(raw.items) ? (raw.items as unknown[]) : [];
  return {
    items: itemsRaw
      .map(normalizePendingRatingItem)
      .filter((it): it is PendingRatingItem => it !== null),
  };
}

export async function listReceivedRatings(query: {
  page?: number;
  pageSize?: number;
}): Promise<ReceivedRatingsResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  const qs = params.toString();
  const raw = await api.get<unknown>(
    `/v1/employer/ratings${qs ? `?${qs}` : ''}`,
  );
  const fallbackPage = query.page ?? 1;
  const fallbackPageSize = query.pageSize ?? 20;
  const dataRaw =
    isObj(raw) && Array.isArray(raw.data) ? (raw.data as unknown[]) : [];
  return {
    data: dataRaw
      .map(normalizeReceivedRating)
      .filter((r): r is ReceivedRatingItem => r !== null),
    pagination: normalizePagination(
      isObj(raw) ? raw.pagination : undefined,
      fallbackPage,
      fallbackPageSize,
    ),
  };
}

export async function submitRating(
  sessionId: string,
  employerId: string,
  input: SubmitRatingInput,
): Promise<SubmitRatingResponse> {
  const raw = await api.post<unknown, SubmitRatingInput>(
    `/v1/employer/work-sessions/${encodeURIComponent(sessionId)}/rating`,
    input,
    { idempotencyKey: ratingIdempotencyKey(sessionId, employerId) },
  );
  const ratingRaw = isObj(raw) ? raw.rating : null;
  const rating = normalizeSubmittedRating(ratingRaw);
  if (!rating) {
    throw new Error('Server returned an unexpected rating payload.');
  }
  return { rating };
}
