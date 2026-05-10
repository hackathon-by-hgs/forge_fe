import { request } from './client';
import type {
  AcceptInvitationRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
  SessionUser,
  VerifyEmailRequest,
} from './types';

/**
 * Endpoint helpers for the Dashboard Auth controller
 * (`/v1/dashboard/auth/*`). Wire format is camelCase per
 * FRONTEND_INTEGRATION.md §3.
 */

export function login(body: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse, LoginRequest>(
    '/v1/dashboard/auth/email/login',
    { method: 'POST', body, authenticated: false, skipRefresh: true },
  );
}

export function forgotPassword(body: ForgotPasswordRequest): Promise<void> {
  return request<void, ForgotPasswordRequest>(
    '/v1/dashboard/auth/email/forgot',
    { method: 'POST', body, authenticated: false, skipRefresh: true },
  );
}

export function resetPassword(body: ResetPasswordRequest): Promise<void> {
  return request<void, ResetPasswordRequest>(
    '/v1/dashboard/auth/email/reset',
    { method: 'POST', body, authenticated: false, skipRefresh: true },
  );
}

export function logout(): Promise<void> {
  return request<void>('/v1/dashboard/auth/logout', {
    method: 'POST',
    authenticated: true,
    skipRefresh: true,
  });
}

export function logoutAll(): Promise<void> {
  return request<void>('/v1/dashboard/auth/logout-all', {
    method: 'POST',
    authenticated: true,
    skipRefresh: true,
  });
}

export function getMe(): Promise<SessionUser> {
  return request<SessionUser>('/v1/dashboard/auth/me');
}

export function verifyEmail(body: VerifyEmailRequest): Promise<void> {
  return request<void, VerifyEmailRequest>(
    '/v1/dashboard/auth/email/verify',
    { method: 'POST', body, authenticated: false, skipRefresh: true },
  );
}

export function acceptInvitation(
  body: AcceptInvitationRequest,
): Promise<LoginResponse> {
  return request<LoginResponse, AcceptInvitationRequest>(
    '/v1/dashboard/auth/team/accept',
    { method: 'POST', body, authenticated: false, skipRefresh: true },
  );
}
