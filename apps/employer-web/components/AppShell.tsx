'use client';

import { type ReactNode } from 'react';
import { Avatar, PageShell, Sidebar, TopBar } from '@forge/ui';
import { IconBuilding } from '@forge/ui/icons';
import { employerNavForRole } from '../lib/nav';
import { useAuth } from '../lib/auth';
import { NotificationsPopover } from './NotificationsPopover';
import { AccountMenu } from './AccountMenu';
import { GlobalSearch } from './GlobalSearch';

const Brand = (
  <div className="flex items-center gap-2">
    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-500 text-white">
      <IconBuilding className="!h-4 !w-4" />
    </div>
    <div className="flex flex-col leading-tight">
      <span className="text-sm font-semibold text-ink">Forge</span>
      <span className="text-[10px] uppercase tracking-wider text-ink-muted">Employer</span>
    </div>
  </div>
);

export function AppShell({ children }: { children: ReactNode }) {
  // This component stays renderable even during auth boot; it can show placeholders.
  const user = useAuth((s) => s.user);
  const userName = user?.fullName ?? '—';
  const userEmail = user?.email ?? '—';
  const businessName = 'Employer';
  const navSections = employerNavForRole(user?.role);

  const sidebarFooter = (
    <div className="flex items-center gap-2.5">
      <Avatar name={businessName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-ink">{businessName}</p>
        <p className="truncate text-[10px] text-ink-muted">{userEmail}</p>
      </div>
    </div>
  );

  return (
    <PageShell
      sidebar={<Sidebar brand={Brand} sections={navSections} footer={sidebarFooter} />}
      topBar={
        <TopBar
          search={<GlobalSearch />}
          end={
            <>
              <NotificationsPopover />
              <AccountMenu
                userName={userName}
                userEmail={userEmail}
                businessName={businessName}
              />
            </>
          }
        />
      }
    >
      {children}
    </PageShell>
  );
}
