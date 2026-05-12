'use client';

import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { EventSourcePolyfill, type EventListenerOrEventListenerObject } from 'event-source-polyfill';
import { getAccessToken, getApiBaseUrl } from './api';

interface StreamEnvelope {
  event: string;
  ts: string;
  data: Record<string, unknown>;
}

const EMPLOYER_EVENT_NAMES = [
  'transaction.updated',
  'score.recomputed',
  'job.lifecycle_changed',
  'worker.clock_event',
] as const;

/**
 * Subscribes to `/v1/stream` once per tab and routes events to React Query
 * invalidations. Per FE_PHASE4_CLOSEOUT.md §4, SSE payloads are *hints* — the
 * BE remains the source of truth and we always refetch the affected queries.
 *
 * Header-based bearer auth requires a polyfill because native EventSource
 * cannot send custom headers.
 */
export function useForgeStream(enabled: boolean): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const token = getAccessToken();
    if (!token) return;

    let base: string;
    try {
      base = getApiBaseUrl();
    } catch {
      return;
    }

    const es = new EventSourcePolyfill(`${base}/v1/stream`, {
      headers: { Authorization: `Bearer ${token}` },
      heartbeatTimeout: 60_000,
    });

    const dispatch = (raw: string) => {
      let payload: StreamEnvelope;
      try {
        payload = JSON.parse(raw) as StreamEnvelope;
      } catch {
        return;
      }
      if (payload.event === 'heartbeat') return;
      applyInvalidations(qc, payload);
    };

    const namedListener: EventListenerOrEventListenerObject = (evt) =>
      dispatch((evt as MessageEvent<string>).data);
    for (const name of EMPLOYER_EVENT_NAMES) {
      es.addEventListener(name, namedListener);
    }
    // Fallback for default `message` events (servers that omit `event:` header).
    es.onmessage = (evt) => dispatch(evt.data);

    es.onerror = () => {
      // The polyfill auto-reconnects with backoff. We may have missed events
      // during the gap, so refetch the dashboard's primary surfaces.
      void qc.invalidateQueries({ queryKey: ['employer'] });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    };

    return () => {
      es.close();
    };
  }, [enabled, qc]);
}

function applyInvalidations(qc: QueryClient, p: StreamEnvelope): void {
  switch (p.event) {
    case 'transaction.updated':
      void qc.invalidateQueries({ queryKey: ['employer', 'transactions'] });
      void qc.invalidateQueries({ queryKey: ['employer', 'payouts'] });
      void qc.invalidateQueries({ queryKey: ['employer', 'overview'] });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
      break;
    case 'score.recomputed':
      void qc.invalidateQueries({ queryKey: ['employer', 'credit'] });
      void qc.invalidateQueries({ queryKey: ['employer', 'overview'] });
      break;
    // Reserved (BE Phase 5) — wire the invalidation now so adding emit is a no-op.
    case 'job.lifecycle_changed':
    case 'worker.clock_event':
      void qc.invalidateQueries({ queryKey: ['employer', 'jobs', 'active'] });
      void qc.invalidateQueries({ queryKey: ['employer', 'overview'] });
      break;
    default:
      break;
  }
}
