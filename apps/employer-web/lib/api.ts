import type { components } from '@forge/types/api';
import { AUTH_LOGIN_PATH } from './publicRoutes';

export type ErrorResponseDto = components['schemas']['ErrorResponseDto'];

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(args: { status: number; code: string; message: string; details?: Record<string, unknown> }) {
    super(args.message);
    this.name = 'ApiError';
    this.status = args.status;
    this.code = args.code;
    this.details = args.details;
  }
}

let accessToken: string | null = null;
let inFlightRefresh: Promise<string | null> | null = null;

export function setAccessToken(next: string | null) {
  accessToken = next;
}

export function getAccessToken() {
  return accessToken;
}

/**
 * API origin or same-origin base.
 * For Next rewrites to the real API, use `NEXT_PUBLIC_API_BASE_URL=/` so requests are
 * `/v1/...` on the app origin — matches HttpOnly refresh cookie Path=/v1/dashboard/auth.
 * Use an absolute URL when calling the API host directly (BE must send cross-site-safe cookies).
 */
export function getApiBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (base === undefined || base === null || !String(base).trim()) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL');
  }
  const trimmed = String(base).trim().replace(/\/+$/, '');
  // "/" only → same-origin relative URLs starting with /v1
  if (trimmed === '' || trimmed === '/') {
    return '';
  }
  return trimmed;
}

export async function parseResponseError(res: Response): Promise<ApiError> {
  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    // ignore
  }

  const envelope = parsed as Partial<ErrorResponseDto> | null;
  const code = envelope?.error?.code ?? 'INTERNAL';
  const message = envelope?.error?.message ?? res.statusText ?? 'Request failed';
  const details = envelope?.error?.details as Record<string, unknown> | undefined;
  return new ApiError({ status: res.status, code, message, details });
}

async function refreshAccessToken(): Promise<string | null> {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    const res = await fetch(`${getApiBaseUrl()}/v1/dashboard/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.status === 401) return null;
    if (!res.ok) throw await parseResponseError(res);

    const data = (await res.json()) as components['schemas']['LoginResponseDto'];
    setAccessToken(data.accessToken);
    return data.accessToken;
  })()
    .catch((err) => {
      throw err;
    })
    .finally(() => {
      inFlightRefresh = null;
    });

  return inFlightRefresh;
}

type RequestOptions = {
  headers?: Record<string, string>;
  idempotencyKey?: string;
  auth?: boolean;
};

async function requestJson<T>(path: string, init: RequestInit, options?: RequestOptions): Promise<T> {
  const url = path.startsWith('http') ? path : `${getApiBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`;

  const initHeaders =
    init.headers && typeof init.headers === 'object' && !Array.isArray(init.headers)
      ? (init.headers as Record<string, string>)
      : {};

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...initHeaders,
    ...(options?.headers ?? {}),
  };

  if (options?.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  const shouldAuth = options?.auth !== false;
  if (shouldAuth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (res.status === 401 && shouldAuth) {
    const next = await refreshAccessToken();
    if (!next) {
      setAccessToken(null);
      if (typeof window !== 'undefined') window.location.assign(AUTH_LOGIN_PATH);
      throw new ApiError({ status: 401, code: 'AUTH_REQUIRED', message: 'Authentication required' });
    }

    const retryHeaders: Record<string, string> = { ...headers, Authorization: `Bearer ${next}` };
    const retryRes = await fetch(url, {
      ...init,
      credentials: 'include',
      headers: retryHeaders,
    });

    if (!retryRes.ok) throw await parseResponseError(retryRes);
    if (retryRes.status === 204 || retryRes.status === 205) {
      return undefined as T;
    }
    const retryCt = retryRes.headers.get('content-type');
    if (!retryCt?.includes('application/json')) {
      return undefined as T;
    }
    return (await retryRes.json()) as T;
  }

  if (!res.ok) throw await parseResponseError(res);
  if (res.status === 204 || res.status === 205) {
    return undefined as T;
  }
  const ct = res.headers.get('content-type');
  if (!ct?.includes('application/json')) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export const api = {
  get: async <T>(path: string, options?: RequestOptions) =>
    requestJson<T>(path, { method: 'GET' }, options),
  post: async <T, B = unknown>(path: string, body?: B, options?: RequestOptions) =>
    requestJson<T>(
      path,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      options,
    ),
  patch: async <T, B = unknown>(path: string, body?: B, options?: RequestOptions) =>
    requestJson<T>(
      path,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      options,
    ),
  del: async <T>(path: string, options?: RequestOptions) =>
    requestJson<T>(path, { method: 'DELETE' }, options),
  refresh: refreshAccessToken,
};

