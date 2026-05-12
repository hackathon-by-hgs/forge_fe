/** Primary sign-in route (use for redirects when session is missing). */
export const AUTH_LOGIN_PATH = '/login';

export function isPublicAuthRoute(pathname: string): boolean {
  if (pathname === AUTH_LOGIN_PATH) return true;
  if (pathname === '/signup/business') return true;
  if (pathname === '/logout') return true;
  if (pathname.startsWith('/auth/')) return true;
  if (pathname.startsWith('/onboarding/')) return true;
  return false;
}

/** Same-origin relative path only; blocks open redirects and auth loops. */
export function safeAuthReturnPath(next: string | null | undefined): string | null {
  if (next == null || next === '') return null;
  let decoded = next;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return null;
  }
  if (!decoded.startsWith('/')) return null;
  if (decoded.startsWith('//')) return null;
  const pathOnly = decoded.split('?')[0] ?? '';
  if (pathOnly === AUTH_LOGIN_PATH) return null;
  if (pathOnly === '/signup/business') return null;
  if (isPublicAuthRoute(pathOnly)) return null;
  return decoded;
}
