/**
 * Wire DTOs for the dashboard API.
 *
 * These are thin aliases over the generated `@forge/types/api` (sourced
 * from `/v1/openapi.json`). Hand-writing endpoint payloads is forbidden
 * per FRONTEND_INTEGRATION.md §13 — when the BE adds endpoints, run
 * `pnpm --filter @forge/types types:gen`.
 */

import type { components } from '@forge/types/api';

type Schemas = components['schemas'];

export type LoginRequest = Schemas['LoginDto'];
export type LoginResponse = Schemas['LoginResponseDto'];
export type SessionUser = Schemas['SessionUserDto'];
export type ForgotPasswordRequest = Schemas['ForgotPasswordDto'];
export type ResetPasswordRequest = Schemas['ResetPasswordDto'];
export type ApiErrorBody = Schemas['ErrorBodyDto'];
export type ApiErrorResponse = Schemas['ErrorResponseDto'];

export type DashboardRole = SessionUser['role'];

export const BANK_ROLES: ReadonlyArray<DashboardRole> = [
  'bank_credit_officer',
  'bank_risk_analyst',
];

export function isBankRole(role: DashboardRole | undefined | null): boolean {
  return !!role && BANK_ROLES.includes(role);
}
