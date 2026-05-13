'use client';

import { useEffect, useRef } from 'react';
import { getApiBaseUrl } from './api/client';
import { getAccessToken } from './auth/tokenStore';

type UseForgeSseArgs = {
  enabled?: boolean;
  onEvent?: (evt: MessageEvent<string>) => void;
};

/**
 * F0 scaffold only (FRONTEND_INTEGRATION.md §7).
 *
 * SSE is a Phase 4 deliverable. Native `EventSource` cannot send `Authorization`;
 * this uses `?token=` until the BE documents a supported fallback or we migrate
 * to `fetch-event-source` with Bearer headers. No exponential backoff yet.
 */
export function useForgeSse({ enabled, onEvent }: UseForgeSseArgs) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    const token = getAccessToken();
    if (!token) return;

    const url = `${getApiBaseUrl()}/v1/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    const handle = (evt: MessageEvent<string>) => onEventRef.current?.(evt);
    es.onmessage = handle;

    return () => {
      es.close();
    };
  }, [enabled]);
}
