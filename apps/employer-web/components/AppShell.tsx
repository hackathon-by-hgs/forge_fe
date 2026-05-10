import { type ReactNode } from 'react';
import { Avatar, Input, PageShell, Sidebar, TopBar } from '@forge/ui';
import { IconBuilding, IconCommand, IconSearch } from '@forge/ui/icons';
import { employerNav } from '../lib/nav';
import { NotificationsPopover } from './NotificationsPopover';
import { AccountMenu } from './AccountMenu';

const USER = {
  name: 'Adeolu Adeyemi',
  email: 'adeolu@apapatrade.ng',
  business: 'Apapa Trade Co.',
};

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

const SidebarFooter = (
  <div className="flex items-center gap-2.5">
    <Avatar name={USER.business} size="sm" />
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-medium text-ink">{USER.business}</p>
      <p className="truncate text-[10px] text-ink-muted">{USER.email}</p>
    </div>
  </div>
);

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <PageShell
      sidebar={<Sidebar brand={Brand} sections={employerNav} footer={SidebarFooter} />}
      topBar={
        <TopBar
          search={
            <Input
              type="search"
              placeholder="Search jobs, workers, transactions…"
              leadingIcon={<IconSearch className="!h-4 !w-4" />}
              trailingIcon={
                <kbd className="hidden items-center gap-1 rounded border border-outline bg-surface-container-high px-1.5 py-0.5 font-mono text-[10px] text-ink-muted sm:inline-flex">
                  <IconCommand className="!h-3 !w-3" />K
                </kbd>
              }
              className="max-w-md"
            />
          }
          end={
            <>
              <NotificationsPopover />
              <AccountMenu
                userName={USER.name}
                userEmail={USER.email}
                businessName={USER.business}
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
