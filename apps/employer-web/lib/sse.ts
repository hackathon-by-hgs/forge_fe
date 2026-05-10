'use client';

import { useEffect, useRef } from 'react';
import { getAccessToken, getApiBaseUrl } from './api';

type UseForgeSseArgs = {
  enabled?: boolean;
  onEvent?: (evt: MessageEvent<string>) => void;
};

/**
 * Phase F0 scaffold only.
 *
 * SSE is a Phase 4 deliverable in the handoff. This hook intentionally does not
 * implement reconnection/backoff/Last-Event-Id yet (consumers will drive that
 * when BE Phase 4 lands).
 */
export function useForgeSse({ enabled, onEvent }: UseForgeSseArgs) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    const token = getAccessToken();
    if (!token) return;

    // Native EventSource can't send headers. If/when the backend supports ?token=
    // we can use that. Otherwise we'll migrate to fetch-event-source in Phase 4.
    const url = `${getApiBaseUrl()}/v1/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    const handle = (evt: MessageEvent<string>) => onEventRef.current?.(evt);
    es.onmessage = handle;

    return () => {
      es.close();
    };
  }, [enabled]);
}

