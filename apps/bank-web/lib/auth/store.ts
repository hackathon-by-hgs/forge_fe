'use client';

import { create } from 'zustand';
import * as authApi from '../api/auth';
import { refreshSession } from '../api/client';
import { NetworkError } from '../api/errors';
import { setAccessToken, setOnAuthLost } from './tokenStore';
import type { LoginRequest, LoginResponse, SessionUser } from '../api/types';

export type BootStatus = 'pending' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: SessionUser | null;
  accessExpiresAt: string | null;
  bootStatus: BootStatus;
  /** True when `/refresh` or `/me` failed due to network — show retry, don't redirect (§2.3). */
  bootNetworkError: boolean;
  signingOut: boolean;

  /** Run on app boot — attempts a silent refresh using the HttpOnly cookie. */
  boot: () => Promise<void>;
  /** Clears the offline flag and re-runs boot (after transient network failure). */
  retryBoot: () => Promise<void>;
  /** Email/password sign-in. Throws on failure; success rehydrates the store. */
  login: (input: LoginRequest) => Promise<LoginResponse>;
  /** Apply a freshly-issued LoginResponse (e.g. after team-invite acceptance) and mark the session authenticated. */
  applyLoginResponse: (res: LoginResponse) => void;
  /** Best-effort server logout, then local clear regardless of result. */
  signOut: (options?: { everywhere?: boolean }) => Promise<void>;
  /** Local-only clear; called by the API client when refresh fails. */
  clearSession: () => void;
}

function applySession(set: (partial: Partial<AuthState>) => void, res: LoginResponse) {
  setAccessToken(res.accessToken);
  set({
    user: res.user,
    accessExpiresAt: res.accessExpiresAt,
    bootStatus: 'authenticated',
    bootNetworkError: false,
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessExpiresAt: null,
  bootStatus: 'pending',
  bootNetworkError: false,
  signingOut: false,

  boot: async () => {
    if (get().bootStatus === 'authenticated') return;
    const outcome = await refreshSession();
    if (outcome === 'network') {
      set({ bootNetworkError: true });
      return;
    }
    set({ bootNetworkError: false });
    if (outcome === 'unauthorized') {
      set({ bootStatus: 'unauthenticated' });
      return;
    }
    try {
      const user = await authApi.getMe();
      set({ user, bootStatus: 'authenticated' });
    } catch (err) {
      if (err instanceof NetworkError) {
        set({ bootNetworkError: true });
        return;
      }
      setAccessToken(null);
      set({ user: null, accessExpiresAt: null, bootStatus: 'unauthenticated' });
    }
  },

  retryBoot: async () => {
    set({ bootNetworkError: false });
    await get().boot();
  },

  login: async (input) => {
    const res = await authApi.login(input);
    applySession(set, res);
    return res;
  },

  applyLoginResponse: (res) => {
    applySession(set, res);
  },

  signOut: async ({ everywhere = false } = {}) => {
    if (get().signingOut) return;
    set({ signingOut: true });
    try {
      try {
        await (everywhere ? authApi.logoutAll() : authApi.logout());
      } catch {
        // Best-effort — local state is the source of truth.
      }
    } finally {
      setAccessToken(null);
      set({
        user: null,
        accessExpiresAt: null,
        bootStatus: 'unauthenticated',
        bootNetworkError: false,
        signingOut: false,
      });
    }
  },

  clearSession: () => {
    setAccessToken(null);
    set({
      user: null,
      accessExpiresAt: null,
      bootStatus: 'unauthenticated',
      bootNetworkError: false,
    });
  },
}));

/* Wire the API client's "auth lost" callback to the store's clearSession.
 * Runs once at module load — the API client's refresh loop fires this
 * when refresh-of-refresh 401s. */
setOnAuthLost(() => {
  useAuthStore.getState().clearSession();
});

export function useAuth() {
  return useAuthStore((s) => ({
    user: s.user,
    bootStatus: s.bootStatus,
    isAuthenticated: s.bootStatus === 'authenticated' && !!s.user,
  }));
}
