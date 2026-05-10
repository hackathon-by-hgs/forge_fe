import {
  ApiError,
  NetworkError,
  parseErrorResponse,
} from './errors';
import {
  fireAuthLost,
  getAccessToken,
  setAccessToken,
} from '../auth/tokenStore';
import type { LoginResponse } from './types';

/**
 * Dashboard API client.
 *
 * Behavior contract (FRONTEND_INTEGRATION.md §2.2):
 *   1. Base URL from `NEXT_PUBLIC_API_BASE_URL`.
 *   2. `credentials: 'include'` on every request — the refresh cookie
 *      is `HttpOnly`, scoped to `/v1/dashboard/auth`, and only the
 *      browser can attach it.
 *   3. Bearer header from the in-memory `tokenStore` (never cookies /
 *      localStorage).
 *   4. Single-flight refresh on 401 → retry once. Refresh-of-refresh
 *      failure clears the session via `fireAuthLost()`.
 *   5. Idempotency-Key is the *caller*'s job, not the wrapper's
 *      (§2.2 + §6) — pass it via `headers`.
 *   6. Every non-2xx parses `{ error: { code, message, details? } }`
 *      and throws `ApiError`.
 */

function baseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!raw) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL is not set. Configure it in apps/bank-web/.env.',
    );
  }
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;

}

/** Used by SSE scaffold and other modules that need the raw origin (FRONTEND_INTEGRATION.md §7). */
export function getApiBaseUrl(): string {
  return baseUrl();
}

export type RefreshOutcome = 'ok' | 'unauthorized' | 'network';

export interface RequestOptions<TBody = unknown> {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  body?: TBody;
  /** Pre-built query string (without the leading `?`). */
  query?: string;
  /** Extra headers — typically `Idempotency-Key` from a mutation. */
  headers?: Record<string, string>;
  /** Override bearer attachment. Defaults to `true`. */
  authenticated?: boolean;
  /** Disable automatic 401 → refresh → retry. Used by `/auth/refresh`. */
  skipRefresh?: boolean;
  signal?: AbortSignal;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* ------------------------------------------------------------------ */
/* Single-flight refresh                                               */
/* ------------------------------------------------------------------ */

let inflightRefresh: Promise<RefreshOutcome> | null = null;

async function performRefresh(): Promise<RefreshOutcome> {
  try {
    const response = await fetch(`${baseUrl()}/v1/dashboard/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      setAccessToken(null);
      fireAuthLost();
      return 'unauthorized';
    }
    const body = (await response.json()) as LoginResponse;
    setAccessToken(body.accessToken);
    return 'ok';
  } catch {
    /* Transient network failure — do not revoke the session (FRONTEND_INTEGRATION.md §2.3). */
    return 'network';
  }
}

function refreshOnce(): Promise<RefreshOutcome> {
  if (!inflightRefresh) {
    inflightRefresh = performRefresh().finally(() => {
      inflightRefresh = null;
    });
  }
  return inflightRefresh;
}

/** Used by boot and internally after 401. */
export function refreshSession(): Promise<RefreshOutcome> {
  return refreshOnce();
}

/* ------------------------------------------------------------------ */
/* Public request                                                      */
/* ------------------------------------------------------------------ */

export async function request<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const {
    method = 'GET',
    body,
    query,
    headers: extraHeaders,
    authenticated = true,
    skipRefresh = false,
    signal,
  } = options;

  const url = `${baseUrl()}${path}${query ? `?${query}` : ''}`;

  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...extraHeaders,
    };
    if (body !== undefined && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (authenticated) {
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    return fetch(url, {
      method,
      credentials: 'include',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  };

  let response: Response;
  try {
    response = await send();
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    throw new NetworkError();
  }

  if (response.status === 401 && authenticated && !skipRefresh) {
    const refreshed = await refreshOnce();
    if (refreshed === 'ok') {
      try {
        response = await send();
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') throw err;
        throw new NetworkError();
      }
    } else if (refreshed === 'network') {
      throw new NetworkError();
    }
    /* unauthorized: fall through — surface the original 401 envelope */
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const payload = await readJson(response);

  if (!response.ok) {
    throw parseErrorResponse(response.status, payload);
  }

  return payload as TResponse;
}

export const apiClient = { request };
export { ApiError, NetworkError };
