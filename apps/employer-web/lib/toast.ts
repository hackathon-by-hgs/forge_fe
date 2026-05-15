/**
 * Thin opinionated wrappers around `@forge/ui`'s `toast()` so individual
 * pages don't have to remember tone tokens or error-translation plumbing.
 *
 * Defaults: success/info auto-dismiss at 4s, warnings at 6s, errors at 8s
 * (long enough to read without being stuck). Pass `durationMs: 0` to pin.
 */

import type { ReactNode } from 'react';
import { toast } from '@forge/ui';
import { humanMessageForError } from './errorMessages';

export interface ToastOptions {
  description?: ReactNode;
  /** ms before auto-dismiss. Default depends on tone. 0 = keep until dismissed. */
  durationMs?: number;
}

export function toastSuccess(title: string, opts?: ToastOptions): number {
  return toast({
    tone: 'success',
    title,
    description: opts?.description,
    durationMs: opts?.durationMs ?? 4000,
  });
}

export function toastInfo(title: string, opts?: ToastOptions): number {
  return toast({
    tone: 'info',
    title,
    description: opts?.description,
    durationMs: opts?.durationMs ?? 4500,
  });
}

export function toastWarn(title: string, opts?: ToastOptions): number {
  return toast({
    tone: 'warning',
    title,
    description: opts?.description,
    durationMs: opts?.durationMs ?? 6000,
  });
}

export function toastError(title: string, opts?: ToastOptions): number {
  return toast({
    tone: 'danger',
    title,
    description: opts?.description,
    durationMs: opts?.durationMs ?? 8000,
  });
}

/**
 * Toast an `ApiError` (or any thrown value) using the friendly code→message
 * map. Pass `titleOverride` for action-specific framing — the description
 * still comes from the mapped code, which is the part users care about.
 */
export function toastApiError(err: unknown, titleOverride?: string): number {
  const { title, description } = humanMessageForError(err, titleOverride);
  return toast({
    tone: 'danger',
    title,
    description,
    durationMs: 8000,
  });
}
