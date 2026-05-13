'use client';

import { useEffect } from 'react';
import { useAuth } from '../../lib/auth';

export default function LogoutPage() {
  const logout = useAuth((s) => s.logout);

  useEffect(() => {
    void logout();
  }, [logout]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <p className="text-sm text-neutral-600">Signing out…</p>
    </div>
  );
}
