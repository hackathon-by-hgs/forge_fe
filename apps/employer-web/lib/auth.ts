import { create } from 'zustand';
import type { components } from '@forge/types/api';
import { getApiBaseUrl, getAccessToken, parseResponseError, setAccessToken, api } from './api';

export type SessionUser = components['schemas']['SessionUserDto'];
export type LoginResponse = components['schemas']['LoginResponseDto'];

type AuthState = {
  booting: boolean;
  bootError: string | null;
  user: SessionUser | null;
  accessExpiresAt: string | null;
  setSession: (s: { user: SessionUser; accessToken: string; accessExpiresAt: string }) => void;
  clearSession: () => void;
  boot: () => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

async function postRefreshSession(): Promise<LoginResponse | null> {
  const res = await fetch(`${getApiBaseUrl()}/v1/dashboard/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  if (res.status === 401) return null;
  if (!res.ok) throw await parseResponseError(res);
  return (await res.json()) as LoginResponse;
}

export const useAuth = create<AuthState>((set, get) => ({
  booting: true,
  bootError: null,
  user: null,
  accessExpiresAt: null,

  setSession: ({ user, accessToken, accessExpiresAt }) => {
    setAccessToken(accessToken);
    set({ user, accessExpiresAt, booting: false, bootError: null });
  },

  clearSession: () => {
    setAccessToken(null);
    set({ user: null, accessExpiresAt: null, booting: false });
  },

  boot: async () => {
    set({ booting: true, bootError: null });
    try {
      const res = await postRefreshSession();
      if (!res) {
        get().clearSession();
        return;
      }
      get().setSession({
        user: res.user,
        accessToken: res.accessToken,
        accessExpiresAt: res.accessExpiresAt,
      });
    } catch (err) {
      set({
        booting: false,
        bootError: err instanceof Error ? err.message : 'Network error',
      });
    }
  },

  login: async ({ email, password }) => {
    const res = await api.post<LoginResponse, components['schemas']['LoginDto']>(
      '/v1/dashboard/auth/email/login',
      { email, password },
      { auth: false },
    );
    get().setSession({
      user: res.user,
      accessToken: res.accessToken,
      accessExpiresAt: res.accessExpiresAt,
    });
  },

  logout: async () => {
    const token = getAccessToken();
    try {
      await fetch(`${getApiBaseUrl()}/v1/dashboard/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // best-effort
    } finally {
      get().clearSession();
      if (typeof window !== 'undefined') window.location.assign('/login');
    }
  },
}));
