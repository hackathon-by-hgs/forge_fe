import type { ApiErrorBody, ApiErrorResponse } from './types';

/**
 * Stable backend error codes we route on, per
 * FRONTEND_INTEGRATION.md §2.2. The list combines the global envelope
 * codes with auth-specific ones surfaced by `/v1/dashboard/auth/*`.
 */
export type KnownErrorCode =
  | 'VALIDATION_FAILED'
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NO_BANK_SCOPE'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'GONE'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_TYPE'
  | 'BUSINESS_RULE_VIOLATION'
  | 'RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'MAINTENANCE'
  | 'INTERNAL'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'EMAIL_NOT_VERIFIED';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(status: number, body: ApiErrorBody) {
    super(
      typeof body.message === 'string' && body.message.trim().length > 0
        ? body.message.trim()
        : 'Something went wrong. Please try again.',
    );
    this.name = 'ApiError';
    this.status = status;
    this.code = typeof body.code === 'string' && body.code ? body.code : 'INTERNAL';
    this.details = body.details;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error. Check your connection and try again.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/**
 * Map an error to a short, human-friendly sentence for the UI.
 * UI shows `message`; logic should branch on `code` (per §2.2).
 */
export function toUserMessage(error: unknown): string {
  if (error == null) {
    return 'Something went wrong. Please try again.';
  }
  if (error instanceof ApiError) {
    const fromCode = ERROR_COPY[error.code as KnownErrorCode];
    if (fromCode) return fromCode;
    if (typeof error.message === 'string' && error.message.trim().length > 0) {
      return error.message.trim();
    }
    return 'Something went wrong. Please try again.';
  }
  if (error instanceof NetworkError) {
    const m = error.message?.trim();
    return m && m.length > 0 ? m : 'Network error. Check your connection and try again.';
  }
  if (error instanceof Error) {
    const m = error.message?.trim();
    if (m && m.length > 0) return m;
  }
  if (typeof error === 'string' && error.trim().length > 0) return error.trim();
  return 'Something went wrong. Please try again.';
}

const ERROR_COPY: Record<KnownErrorCode, string> = {
  VALIDATION_FAILED: 'Please check the information you entered and try again.',
  AUTH_REQUIRED: 'Please sign in to continue.',
  FORBIDDEN: "You don't have permission to do that.",
  NO_BANK_SCOPE:
    "This account isn't linked to a bank yet. Ask your admin or Forge support to finish provisioning.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  CONFLICT: "That action conflicts with the current state. Refresh and try again.",
  GONE: 'That resource is no longer available.',
  FILE_TOO_LARGE: 'File is too large. Please upload a smaller one.',
  UNSUPPORTED_TYPE: 'Unsupported file type.',
  BUSINESS_RULE_VIOLATION: "That action isn't allowed right now.",
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  PROVIDER_UNAVAILABLE: 'A downstream service is unavailable. Try again shortly.',
  MAINTENANCE: 'The service is briefly unavailable for maintenance.',
  INTERNAL: 'Something went wrong on our side. Please try again.',
  EMAIL_ALREADY_REGISTERED: 'An account already exists for that email.',
  INVALID_CREDENTIALS: "Email or password didn't match. Please try again.",
  TOKEN_INVALID: 'Your session is invalid. Please sign in again.',
  TOKEN_EXPIRED: 'Your session expired. Please sign in again.',
  EMAIL_NOT_VERIFIED: 'Please verify your email before signing in.',
};

/** Normalize an unknown response body into an ApiError. */
export function parseErrorResponse(status: number, body: unknown): ApiError {
  const maybe = body as Partial<ApiErrorResponse> | undefined;
  const rawErr =
    maybe && typeof maybe === 'object' && 'error' in maybe ? maybe.error : undefined;
  if (rawErr && typeof rawErr === 'object') {
    const e = rawErr as Record<string, unknown>;
    const code =
      typeof e.code === 'string' && e.code.trim().length > 0
        ? e.code.trim()
        : status === 401
          ? 'AUTH_REQUIRED'
          : 'INTERNAL';
    const message =
      typeof e.message === 'string' && e.message.trim().length > 0
        ? e.message.trim()
        : code === 'AUTH_REQUIRED'
          ? 'Please sign in to continue.'
          : 'Unexpected response from server.';
    const details =
      e.details && typeof e.details === 'object'
        ? (e.details as Record<string, unknown>)
        : undefined;
    return new ApiError(status, { code, message, details });
  }
  return new ApiError(status, {
    code: status === 401 ? 'AUTH_REQUIRED' : 'INTERNAL',
    message:
      status === 401
        ? 'Please sign in to continue.'
        : typeof body === 'string' && body.trim().length > 0
          ? body.trim()
          : 'Unexpected response from server.',
  });
}
