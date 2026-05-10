export function isPublicAuthRoute(pathname: string): boolean {
  if (pathname === '/login') return true;
  if (pathname === '/signup/business') return true;
  if (pathname === '/logout') return true;
  if (pathname.startsWith('/auth/')) return true;
  if (pathname.startsWith('/onboarding/')) return true;
  return false;
}
