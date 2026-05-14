'use client';

import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { EventSourcePolyfill, type EventListenerOrEventListenerObject } from 'event-source-polyfill';
import { toast } from '@forge/ui';
import { formatCurrency } from '@forge/ui/utils';
import { getAccessToken, getApiBaseUrl } from './api';
import type { JobDto, JobProofResponse } from './jobsApi';

interface StreamEnvelope {
  event: string;
  ts: string;
  data: Record<string, unknown>;
}

interface SseErrorEvent extends Event {
  status?: number;
}

interface PendingClockOut {
  jobId: string;
  workerName: string;
  ts: number;
}

// Window for correlating worker.clock_event with the trailing transaction.updated
// that carries the payment status. The BE emits all three events within ~200ms.
const CLOCKOUT_TOAST_WINDOW_MS = 10_000;

const EMPLOYER_EVENT_NAMES = [
  'transaction.updated',
  'score.recomputed',
  'job.lifecycle_changed',
  'worker.clock_event',
  'session.pending_review',
  'session.review_resolved',
  // §27 ratings: fires when a rating row is created (employer-side and, once
  // the BE wires worker-side push, worker-side too). Used to auto-clear the
  // pending-ratings inbox without an explicit refetch in the dialog.
  'rating.created',
  // NOTE: `withdrawal.terminal` is a *broadcast* event the BE emits to all
  // SSE subscribers for admin/ops visibility into worker withdrawals. The
  // employer dashboard intentionally does NOT subscribe to it — omitting it
  // from this array is the filter (the polyfill only fires
  // addEventListener handlers for names we list here). Don't add it.
] as const;

const SSE_LOG_PREFIX = '[forge-sse]';

function devWarn(message: string, err: unknown): void {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(`${SSE_LOG_PREFIX} ${message}`, err);
  }
}

const noop = (): void => {};

/**
 * Subscribes to `/v1/stream` once per tab and routes events to React Query
 * invalidations. Per FE_PHASE4_CLOSEOUT.md §4, SSE payloads are *hints* — the
 * BE remains the source of truth and we always refetch the affected queries.
 *
 * Header-based bearer auth requires a polyfill because native EventSource
 * cannot send custom headers.
 *
 * Hardened so no error path can surface as Next.js's "Application error"
 * overlay or as an unhandled-rejection on `window`:
 *
 *   - All side-effecting work runs inside `useEffect`. Synchronous throws
 *     can't reach render.
 *   - Every external call is individually try/caught: getAccessToken,
 *     getApiBaseUrl, `new EventSourcePolyfill`, addEventListener loop,
 *     JSON.parse, and every queryClient.invalidateQueries (via
 *     `safeInvalidate`, which catches both sync throws and promise
 *     rejections so neither can become an unhandled rejection).
 *   - Listener callbacks have their own outer try/catch — a throw from a
 *     listener used to be fatal because the polyfill propagates it as an
 *     internal error and marks the stream dead.
 *   - 401/403 on the underlying request closes the connection instead of
 *     letting the polyfill auto-reconnect forever with a dead bearer
 *     (which would 401-storm the BE).
 *   - `safeClose()` is idempotent and swallows errors.
 *   - All event objects accessed via optional chaining — defensive against
 *     the polyfill or browser ever delivering a null `evt`.
 *   - Payload shape validated after JSON.parse — non-string `event` fields
 *     are silently dropped rather than crashing the switch.
 *   - All warnings gated on `NODE_ENV !== 'production'` so prod stays quiet.
 */
export function useForgeStream(enabled: boolean): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let token: string | null;
    try {
      token = getAccessToken();
    } catch (err) {
      devWarn('getAccessToken threw:', err);
      return;
    }
    if (!token) return;

    let base: string;
    try {
      base = getApiBaseUrl();
    } catch (err) {
      devWarn('getApiBaseUrl threw:', err);
      return;
    }

    let es: EventSourcePolyfill;
    try {
      es = new EventSourcePolyfill(`${base}/v1/stream`, {
        headers: { Authorization: `Bearer ${token}` },
        heartbeatTimeout: 60_000,
      });
    } catch (err) {
      devWarn('Failed to open EventSource:', err);
      return;
    }

    let closed = false;
    const safeClose = (): void => {
      if (closed) return;
      closed = true;
      try {
        es.close();
      } catch {
        // closing twice or after an internal error is harmless
      }
    };

    const safeInvalidate = (queryKey: readonly unknown[]): void => {
      try {
        const result = qc.invalidateQueries({ queryKey: [...queryKey] });
        // React Query swallows refetch errors internally, but attach a catch
        // defensively in case a future version surfaces them as unhandled
        // promise rejections (which would fire window.onunhandledrejection).
        if (result && typeof (result as Promise<unknown>).catch === 'function') {
          (result as Promise<unknown>).catch(noop);
        }
      } catch (err) {
        devWarn('invalidateQueries threw:', err);
      }
    };

    // FIFO of recent clock-outs awaiting the trailing transaction.updated so
    // we can fire the job-detail toast with the resolved payment status.
    // worker.clock_event carries jobId but no payment outcome;
    // transaction.updated carries the outcome but no jobId — we correlate
    // them by arrival order within CLOCKOUT_TOAST_WINDOW_MS.
    const pendingClockOuts: PendingClockOut[] = [];

    const dispatch = (raw: unknown): void => {
      if (closed) return;
      if (typeof raw !== 'string') return;
      let payload: StreamEnvelope;
      try {
        payload = JSON.parse(raw) as StreamEnvelope;
      } catch {
        return;
      }
      if (
        !payload ||
        typeof payload !== 'object' ||
        typeof payload.event !== 'string'
      ) {
        return;
      }
      if (payload.event === 'heartbeat') return;
      try {
        applySideEffects(qc, pendingClockOuts, payload);
      } catch (err) {
        devWarn(`applySideEffects(${payload.event}) threw:`, err);
      }
      try {
        applyInvalidations(safeInvalidate, payload);
      } catch (err) {
        devWarn(`applyInvalidations(${payload.event}) threw:`, err);
      }
    };

    const namedListener: EventListenerOrEventListenerObject = (evt) => {
      try {
        dispatch((evt as MessageEvent<string> | null | undefined)?.data);
      } catch (err) {
        devWarn('Named listener threw:', err);
      }
    };

    try {
      for (const name of EMPLOYER_EVENT_NAMES) {
        es.addEventListener(name, namedListener);
      }
      // Fallback for default `message` events (servers that omit `event:` header).
      es.onmessage = (evt) => {
        try {
          dispatch((evt as MessageEvent<string> | null | undefined)?.data);
        } catch (err) {
          devWarn('onmessage threw:', err);
        }
      };
      // SSE has no replay; events fired during a disconnect are lost. When the
      // polyfill auto-reconnects it fires `open` again — treat the second-and-
      // later open as a reconnect signal and refetch the dashboard surfaces.
      let hasOpened = false;
      es.onopen = () => {
        if (!hasOpened) {
          hasOpened = true;
          return;
        }
        safeInvalidate(['employer']);
        safeInvalidate(['notifications']);
      };
      es.onerror = (evt) => {
        const status = (evt as SseErrorEvent | null | undefined)?.status;
        // 401/403: token expired or revoked mid-stream. The polyfill would
        // otherwise reconnect forever with the dead bearer and 401-storm
        // the BE. Close here; the next page navigation or auth boot picks
        // up a fresh token and a new subscription opens.
        if (status === 401 || status === 403) {
          safeClose();
          return;
        }
        // Transient network errors: the polyfill auto-reconnects with backoff.
        // SSE has no replay, so refetch the dashboard's primary surfaces on
        // each error — invalidate is cheap and idempotent.
        safeInvalidate(['employer']);
        safeInvalidate(['notifications']);
      };
    } catch (err) {
      devWarn('Failed to wire listeners:', err);
      safeClose();
      return;
    }

    return () => {
      safeClose();
    };
  }, [enabled, qc]);
}

/**
 * Surface user-facing side effects (toasts, optimistic cache writes) tied to
 * specific event payloads. SSE payloads remain hints — invalidation does the
 * heavy lifting; this function only writes UI sugar that benefits from the
 * payload arriving before the REST refetch returns.
 *
 *   - transaction.updated / va_funding: wallet top-up toast.
 *   - worker.clock_event / clock_out: queue a pending-clock-out entry so the
 *     trailing transaction.updated can fire a payment-resolved toast on the
 *     job-detail page; optimistically prepend the proof photo if the gallery
 *     is open.
 *   - transaction.updated / job_completion: pop the queue and toast on the
 *     job-detail page if the user is still viewing the relevant job.
 */
function applySideEffects(
  qc: QueryClient,
  pendingClockOuts: PendingClockOut[],
  p: StreamEnvelope,
): void {
  const data = p.data && typeof p.data === 'object' ? p.data : ({} as Record<string, unknown>);
  switch (p.event) {
    case 'transaction.updated': {
      if (data.source === 'va_funding') {
        const amount = typeof data.amountNaira === 'number' ? data.amountNaira : null;
        if (amount == null || !Number.isFinite(amount)) return;
        toast({
          tone: 'success',
          title: `${formatCurrency(amount)} received in your wallet`,
          description: 'External top-up cleared. Refreshing your balance.',
        });
        return;
      }
      if (data.source === 'job_completion') {
        const status = typeof data.status === 'string' ? data.status : null;
        if (status !== 'succeeded' && status !== 'pending') return;
        const ctx = popFreshClockOut(pendingClockOuts);
        if (!ctx) return;
        // Only toast if the user is still viewing the relevant job — confirmed
        // by the detail query still being cached at toast time.
        const cached = qc.getQueryData<JobDto>(['employer', 'jobs', 'detail', ctx.jobId]);
        if (!cached) return;
        toast({
          tone: status === 'succeeded' ? 'success' : 'info',
          title: `${ctx.workerName} clocked out — payment ${status}.`,
        });
      }
      return;
    }
    case 'worker.clock_event': {
      if (data.kind !== 'clock_out') return;
      const jobId = typeof data.jobId === 'string' ? data.jobId : null;
      if (!jobId) return;
      const cachedJob = qc.getQueryData<JobDto>(['employer', 'jobs', 'detail', jobId]);
      const workerName = cachedJob?.assignedWorker?.fullName;
      if (workerName) {
        pruneStaleClockOuts(pendingClockOuts);
        pendingClockOuts.push({ jobId, workerName, ts: Date.now() });
      }
      // Optimistic proof-gallery prepend: only writes when the proof query is
      // already in cache (user has the gallery open or has just opened it).
      // The trailing invalidation will replace this entry with the canonical
      // payload once the BE refetch returns.
      const proofUrl =
        typeof data.proofPhotoUrl === 'string' && data.proofPhotoUrl ? data.proofPhotoUrl : null;
      if (!proofUrl) return;
      const proofKey = ['employer', 'jobs', 'proof', jobId] as const;
      const proofData = qc.getQueryData<JobProofResponse>([...proofKey]);
      if (!proofData) return;
      const workerId = typeof data.workerId === 'string' ? data.workerId : '';
      const at = typeof data.at === 'string' ? data.at : new Date().toISOString();
      qc.setQueryData<JobProofResponse>([...proofKey], {
        ...proofData,
        photos: [
          {
            id: `optimistic-${Date.now()}`,
            workerId,
            at,
            url: proofUrl,
            exif: { lat: null, lng: null, takenAt: null },
          },
          ...proofData.photos,
        ],
      });
      return;
    }
    case 'session.pending_review': {
      const workerId = typeof data.workerId === 'string' ? data.workerId : null;
      const jobId = typeof data.jobId === 'string' ? data.jobId : null;
      const sessionId = typeof data.sessionId === 'string' ? data.sessionId : null;
      const amount =
        typeof data.payAmountPendingNaira === 'number' ? data.payAmountPendingNaira : null;
      const workerName = workerId ? lookupWorkerName(qc, workerId, jobId) : null;
      const label = workerName ?? 'A worker';
      toast({
        tone: 'warning',
        title: `${label} clocked out — review needed`,
        description:
          amount != null
            ? `${formatCurrency(amount)} on hold for the next 2 hours. Open the review queue to confirm or dispute.`
            : 'Open the review queue to confirm or dispute the payout.',
        durationMs: 8000,
      });
      // Sidebar / overview tile counters refresh via invalidation; the SSE
      // payload itself is enough to populate the review-queue cache if the
      // dedicated list endpoint hasn't shipped yet.
      if (sessionId) {
        applyOptimisticReviewQueueInsert(qc, {
          sessionId,
          jobId,
          workerId,
          amount,
          at: typeof p.ts === 'string' ? p.ts : new Date().toISOString(),
          holdReleaseAt:
            typeof data.holdReleaseAt === 'string' ? data.holdReleaseAt : null,
          proofPhotoUrl:
            typeof data.proofPhotoUrl === 'string' ? data.proofPhotoUrl : null,
        });
      }
      return;
    }
    case 'session.review_resolved': {
      const outcome = typeof data.outcome === 'string' ? data.outcome : null;
      const sessionId = typeof data.sessionId === 'string' ? data.sessionId : null;
      const cachedSession = sessionId
        ? qc.getQueryData<{ worker?: { fullName?: string } }>([
            'employer',
            'review-queue',
            'detail',
            sessionId,
          ])
        : null;
      const workerLabel = cachedSession?.worker?.fullName ?? 'A worker';
      if (outcome === 'employer_confirmed') {
        toast({
          tone: 'success',
          title: `Confirmed payout for ${workerLabel}`,
          description: 'Funds are on the way to the worker.',
        });
      } else if (outcome === 'disputed') {
        toast({
          tone: 'info',
          title: `Dispute opened against ${workerLabel}'s clock-out`,
          description: 'Funds stay in your wallet pending ops resolution.',
        });
      } else if (outcome === 'auto_released') {
        // The 2-hour window expired without action — call it out, since the
        // employer almost certainly didn't intend this path.
        toast({
          tone: 'warning',
          title: `${workerLabel}'s payout auto-released`,
          description: 'The 2-hour review window expired without a decision.',
          durationMs: 10000,
        });
      }
      return;
    }
    case 'job.lifecycle_changed': {
      const status = typeof data.status === 'string' ? data.status : null;
      if (status !== 'completed') return;
      const jobId = typeof data.jobId === 'string' ? data.jobId : null;
      const cachedJob = jobId
        ? qc.getQueryData<JobDto>(['employer', 'jobs', 'detail', jobId])
        : null;
      const title = cachedJob?.title ?? 'A job';
      toast({
        tone: 'success',
        title: `${title} is complete`,
        description: 'All sessions have settled.',
      });
      return;
    }
    case 'score.recomputed': {
      toast({
        tone: 'info',
        title: 'Your business score updated',
        description: 'Open Credit & Loans to see the new breakdown.',
      });
      return;
    }
    default:
      return;
  }
}

function lookupWorkerName(
  qc: QueryClient,
  workerId: string,
  jobId: string | null,
): string | null {
  // Try the job-detail cache first (assignedWorker hydrated), then the
  // standalone worker-detail cache. Both are best-effort — falling back to
  // a generic label is acceptable for a hint toast.
  if (jobId) {
    const job = qc.getQueryData<JobDto>(['employer', 'jobs', 'detail', jobId]);
    if (job?.assignedWorker?.id === workerId && job.assignedWorker.fullName) {
      return job.assignedWorker.fullName;
    }
  }
  const worker = qc.getQueryData<{ fullName?: string }>([
    'employer',
    'workers',
    'detail',
    workerId,
  ]);
  return worker?.fullName ?? null;
}

interface OptimisticReviewQueueInsert {
  sessionId: string;
  jobId: string | null;
  workerId: string | null;
  amount: number | null;
  at: string;
  holdReleaseAt: string | null;
  proofPhotoUrl: string | null;
}

/**
 * Prepend a minimal placeholder row to the review-queue cache so the badge
 * count / list updates instantly. The subsequent invalidation will refetch
 * the canonical payload and replace this entry. Skips if the cache is empty
 * (user hasn't visited the queue yet — nothing to optimistically update).
 */
function applyOptimisticReviewQueueInsert(
  qc: QueryClient,
  next: OptimisticReviewQueueInsert,
): void {
  const key = ['employer', 'review-queue'] as const;
  const current = qc.getQueryData<{ data?: Array<Record<string, unknown>> }>([...key]);
  if (!current || !Array.isArray(current.data)) return;
  if (current.data.some((row) => (row as { id?: string }).id === next.sessionId)) return;
  qc.setQueryData([...key], {
    ...current,
    data: [
      {
        id: next.sessionId,
        jobId: next.jobId ?? '',
        workerId: next.workerId ?? '',
        verificationState: 'auto_review',
        payAmountPendingNaira: next.amount ?? 0,
        payAmountDisbursedNaira: 0,
        holdReleaseAt: next.holdReleaseAt ?? next.at,
        clockInAt: next.at,
        clockOutAt: next.at,
        proofPhotoUrl: next.proofPhotoUrl,
        worker: { id: next.workerId ?? '', fullName: 'Awaiting refresh…' },
        job: { id: next.jobId ?? '', title: 'Awaiting refresh…' },
      },
      ...current.data,
    ],
  });
}

function pruneStaleClockOuts(queue: PendingClockOut[]): void {
  const cutoff = Date.now() - CLOCKOUT_TOAST_WINDOW_MS;
  while (queue.length > 0) {
    const head = queue[0];
    if (!head || head.ts >= cutoff) break;
    queue.shift();
  }
}

function popFreshClockOut(queue: PendingClockOut[]): PendingClockOut | null {
  pruneStaleClockOuts(queue);
  return queue.shift() ?? null;
}

function applyInvalidations(
  invalidate: (queryKey: readonly unknown[]) => void,
  p: StreamEnvelope,
): void {
  switch (p.event) {
    case 'transaction.updated':
      // Per brief: invalidation set is identical for every transaction source
      // (va_funding, job_completion, webhook, cron, stub_topup). `source` is
      // diagnostic, not routing.
      invalidate(['employer', 'transactions']);
      invalidate(['employer', 'payouts']);
      invalidate(['employer', 'overview']);
      invalidate(['notifications']);
      break;
    case 'score.recomputed':
      invalidate(['employer', 'credit']);
      invalidate(['employer', 'overview']);
      break;
    case 'worker.clock_event':
      // Broad `['employer','jobs']` prefix covers detail/timeline/proof/
      // applications/list/active for the affected job — cheaper to fan out
      // than to enumerate every sub-key on a relatively rare event.
      invalidate(['employer', 'jobs']);
      invalidate(['employer', 'overview']);
      invalidate(['employer', 'active-map']);
      invalidate(['employer', 'workers', 'active']);
      break;
    case 'job.lifecycle_changed':
      invalidate(['employer', 'jobs']);
      invalidate(['employer', 'overview']);
      invalidate(['employer', 'active-map']);
      invalidate(['employer', 'workers', 'active']);
      invalidate(['employer', 'transactions']);
      break;
    case 'session.pending_review':
      // §11.7: a clock-out has entered the 2h employer review window. The
      // review-queue list, overview tile, and notification bell all need to
      // reflect the new pending item.
      invalidate(['employer', 'review-queue']);
      invalidate(['employer', 'overview']);
      invalidate(['notifications']);
      break;
    case 'session.review_resolved':
      // §11.7: confirm / dispute / auto-release. Refresh the queue, the
      // session detail, and the payments-transactions surface (a successful
      // confirm or auto-release creates a transaction; a dispute zeroes
      // pay_amount_pending and opens a dispute row).
      invalidate(['employer', 'review-queue']);
      invalidate(['employer', 'overview']);
      invalidate(['notifications']);
      invalidate(['employer', 'transactions']);
      break;
    case 'rating.created':
      // §27: a rating row was just inserted (employer-side: a rating they
      // submitted clears the row from their pending inbox; worker-side: a
      // counterpart rating arrived, may unblind aggregates). Both surfaces
      // refetch on this signal — cheaper than threading invalidation through
      // every submit handler.
      invalidate(['employer', 'pending-ratings']);
      invalidate(['employer', 'ratings']);
      invalidate(['employer', 'overview']);
      break;
    default:
      break;
  }
}
