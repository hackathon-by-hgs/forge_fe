'use client';

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import type { StatusTone } from '@forge/types';
import { cn } from '../utils/cn';

export type ToastTone = Extract<StatusTone, 'warning' | 'danger' | 'info' | 'success'>;

export interface ToastInput {
  title: string;
  description?: ReactNode;
  tone?: ToastTone;
  /** ms before auto-dismiss. Default 4000. Pass 0 to keep until manual dismiss. */
  durationMs?: number;
}

interface ToastItem extends ToastInput {
  id: number;
}

/**
 * Module-level toast store. Callable from anywhere (incl. SSE event handlers
 * that aren't mounted under a React provider), unlike a context-based design.
 * <Toaster /> mounts once per app and renders the queue via a portal.
 */
let nextId = 0;
let toasts: ToastItem[] = [];
const subscribers = new Set<() => void>();

function notify(): void {
  subscribers.forEach((fn) => {
    try {
      fn();
    } catch {
      // a subscriber throwing must not stop other subscribers from updating
    }
  });
}

function subscribe(fn: () => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

function getSnapshot(): ToastItem[] {
  return toasts;
}

function getServerSnapshot(): ToastItem[] {
  return [];
}

export function toast(input: ToastInput): number {
  const id = ++nextId;
  const item: ToastItem = { ...input, id };
  toasts = [...toasts, item];
  notify();
  const dur = input.durationMs ?? 4000;
  if (dur > 0 && typeof window !== 'undefined') {
    window.setTimeout(() => dismissToast(id), dur);
  }
  return id;
}

export function dismissToast(id: number): void {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'bg-success-50 border-success-500/30 text-success-700',
  warning: 'bg-warning-50 border-warning-500/30 text-warning-700',
  danger: 'bg-danger-50 border-danger-500/30 text-danger-700',
  info: 'bg-info-50 border-info-500/30 text-info-700',
};

export function Toaster(): JSX.Element | null {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[1000] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-4"
      aria-live="polite"
      aria-atomic="false"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'pointer-events-auto w-full max-w-sm rounded-lg border px-4 py-3 text-sm shadow-md',
            TONE_CLASS[t.tone ?? 'info'],
          )}
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{t.title}</p>
              {t.description ? (
                <p className="mt-0.5 text-xs opacity-90">{t.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss"
              className="shrink-0 rounded p-1 leading-none hover:bg-black/5"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
}
