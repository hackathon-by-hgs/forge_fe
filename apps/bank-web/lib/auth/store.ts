'use client';

import { create } from 'zustand';
import * as authApi from '../api/auth';
import { refreshSession } from '../api/client';
import { setAccessToken, setOnAuthLost } from './tokenStore';
import type { LoginRequest, LoginResponse, SessionUser } from '../api/types';

export type BootStatus = 'pending' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: SessionUser | null;
  accessExpiresAt: string | null;
  bootStatus: BootStatus;
  signingOut: boolean;

  /** Run on app boot — attempts a silent refresh using the HttpOnly cookie. */
  boot: () => Promise<void>;
  /** Email/password sign-in. Throws on failure; success rehydrates the store. */
  login: (input: LoginRequest) => Promise<LoginResponse>;
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
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessExpiresAt: null,
  bootStatus: 'pending',
  signingOut: false,

  boot: async () => {
    if (get().bootStatus === 'authenticated') return;
    const ok = await refreshSession();
    if (!ok) {
      set({ bootStatus: 'unauthenticated' });
      return;
    }
    try {
      const user = await authApi.getMe();
      set({ user, bootStatus: 'authenticated' });
    } catch {
      setAccessToken(null);
      set({ user: null, accessExpiresAt: null, bootStatus: 'unauthenticated' });
    }
  },

  login: async (input) => {
    const res = await authApi.login(input);
    applySession(set, res);
    return res;
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
