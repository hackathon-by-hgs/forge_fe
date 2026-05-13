'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/auth/store';

export default function LogoutPage() {
  const router = useRouter();
  const { signOut, signingOut } = useAuthStore((s) => ({
    signOut: s.signOut,
    signingOut: s.signingOut,
  }));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await signOut();
      if (!cancelled) router.replace('/login');
    })();
    return () => {
      cancelled = true;
    };
  }, [router, signOut]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <p className="text-sm text-ink-muted">
        {signingOut ? 'Signing out…' : 'Redirecting…'}
      </p>
    </div>
  );
}
