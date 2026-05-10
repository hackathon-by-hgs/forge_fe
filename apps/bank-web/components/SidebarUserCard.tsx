'use client';

import { Avatar } from '@forge/ui';
import { useAuthStore } from '../lib/auth/store';
import { roleLabel } from '../lib/auth/roleLabel';

export function SidebarUserCard() {
  const { user, bootStatus } = useAuthStore((s) => ({
    user: s.user,
    bootStatus: s.bootStatus,
  }));

  if (bootStatus !== 'authenticated' || !user) {
    return (
      <div className="flex items-center gap-2.5">
        <Avatar name="Forge" size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink">Forge Lender</p>
          <p className="truncate text-[10px] text-ink-muted">
            {bootStatus === 'pending' ? 'Loading session…' : 'Sign in to continue'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={user.fullName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-ink">{user.fullName}</p>
        <p className="truncate text-[10px] text-ink-muted">{roleLabel(user.role)}</p>
      </div>
    </div>
  );
}
