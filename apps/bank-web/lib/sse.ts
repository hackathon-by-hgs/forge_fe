'use client';

import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { EventSourcePolyfill, type EventListenerOrEventListenerObject } from 'event-source-polyfill';
import { getApiBaseUrl } from './api/client';
import { getAccessToken } from './auth/tokenStore';

interface StreamEnvelope {
  event: string;
  ts: string;
  data: Record<string, unknown>;
}

const BANK_EVENT_NAMES = [
  'loan.disbursed',
  'loan.repayment_paid',
  'loan.risk_changed',
  'application.decided',
] as const;

/**
 * Subscribes to `/v1/stream` once per tab and routes events to React Query
 * invalidations. Per FE_PHASE4_CLOSEOUT.md §4, SSE payloads are *hints* — the
 * BE remains the source of truth and we always refetch the affected queries.
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
    for (const name of BANK_EVENT_NAMES) {
      es.addEventListener(name, namedListener);
    }
    es.onmessage = (evt) => dispatch(evt.data);

    es.onerror = () => {
      void qc.invalidateQueries({ queryKey: ['bank'] });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    };

    return () => {
      es.close();
    };
  }, [enabled, qc]);
}

function applyInvalidations(qc: QueryClient, p: StreamEnvelope): void {
  const data = p.data ?? {};
  switch (p.event) {
    case 'loan.disbursed':
    case 'loan.repayment_paid':
    case 'loan.risk_changed': {
      void qc.invalidateQueries({ queryKey: ['bank', 'risk-radar'] });
      void qc.invalidateQueries({ queryKey: ['bank', 'loans'] });
      const loanId = typeof data.loanId === 'string' ? data.loanId : undefined;
      if (loanId) {
        void qc.invalidateQueries({ queryKey: ['bank', 'loans', loanId] });
      }
      if (p.event === 'loan.risk_changed' || p.event === 'loan.disbursed') {
        void qc.invalidateQueries({ queryKey: ['notifications'] });
      }
      break;
    }
    case 'application.decided': {
      void qc.invalidateQueries({ queryKey: ['bank', 'applications'] });
      void qc.invalidateQueries({ queryKey: ['bank', 'risk-radar'] });
      void qc.invalidateQueries({ queryKey: ['bank', 'loans'] });
      const applicationId =
        typeof data.applicationId === 'string' ? data.applicationId : undefined;
      if (applicationId) {
        void qc.invalidateQueries({ queryKey: ['bank', 'applications', applicationId] });
      }
      break;
    }
    default:
      break;
  }
}
