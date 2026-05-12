'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { EventSourcePolyfill, type EventListenerOrEventListenerObject } from 'event-source-polyfill';
import { toast } from '@forge/ui';
import { formatCurrency } from '@forge/ui/utils';
import { getAccessToken, getApiBaseUrl } from './api';

interface StreamEnvelope {
  event: string;
  ts: string;
  data: Record<string, unknown>;
}

interface SseErrorEvent extends Event {
  status?: number;
}

const EMPLOYER_EVENT_NAMES = [
  'transaction.updated',
  'score.recomputed',
  'job.lifecycle_changed',
  'worker.clock_event',
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
        showSideEffectToast(payload);
      } catch (err) {
        devWarn(`showSideEffectToast(${payload.event}) threw:`, err);
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
 * Surface user-facing side effects (toasts, etc.) tied to specific event
 * payloads. Per FE_MONEY_END_TO_END.md §5: branch on
 * `data.source === 'va_funding'` for incoming-funds notifications.
 */
function showSideEffectToast(p: StreamEnvelope): void {
  if (p.event !== 'transaction.updated') return;
  const data = p.data && typeof p.data === 'object' ? p.data : ({} as Record<string, unknown>);
  if (data.source !== 'va_funding') return;
  const amount = typeof data.amountNaira === 'number' ? data.amountNaira : null;
  if (amount == null || !Number.isFinite(amount)) return;
  toast({
    tone: 'success',
    title: `${formatCurrency(amount)} received in your wallet`,
    description: 'External top-up cleared. Refreshing your balance.',
  });
}

function applyInvalidations(
  invalidate: (queryKey: readonly unknown[]) => void,
  p: StreamEnvelope,
): void {
  switch (p.event) {
    case 'transaction.updated':
      invalidate(['employer', 'transactions']);
      invalidate(['employer', 'payouts']);
      invalidate(['employer', 'overview']);
      invalidate(['notifications']);
      break;
    case 'score.recomputed':
      invalidate(['employer', 'credit']);
      invalidate(['employer', 'overview']);
      break;
    // Reserved (BE Phase 5) — wire the invalidation now so adding emit is a no-op.
    case 'job.lifecycle_changed':
    case 'worker.clock_event':
      invalidate(['employer', 'jobs', 'active']);
      invalidate(['employer', 'overview']);
      break;
    default:
      break;
  }
}
