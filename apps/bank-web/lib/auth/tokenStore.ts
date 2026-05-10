/**
 * Module-level access token holder.
 *
 * Per FRONTEND_INTEGRATION.md §2.2 and §13: the access token lives in
 * memory only — never `localStorage`, never a JS-readable cookie. The
 * Zustand auth store mirrors this value into React land via
 * `useSyncExternalStore`-style subscriptions.
 *
 * The API client imports this module directly (not React) so it stays
 * framework-agnostic and can fire from any call site.
 */

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

let onAuthLost: () => void = () => {};

/**
 * Register a callback to fire when refresh fails after a 401. The
 * Zustand store calls this once on init to wire `clearSession()` into
 * the refresh loop, decoupling the API client from React.
 */
export function setOnAuthLost(handler: () => void): void {
  onAuthLost = handler;
}

export function fireAuthLost(): void {
  onAuthLost();
}
