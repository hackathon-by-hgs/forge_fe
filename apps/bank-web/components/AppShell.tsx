import { type ReactNode } from 'react';
import {
  Avatar,
  Input,
  PageShell,
  Sidebar,
  TopBar,
} from '@forge/ui';
import { IconBank, IconCommand, IconSearch } from '@forge/ui/icons';
import { bankNav } from '../lib/nav';
import { NotificationsPopover } from './NotificationsPopover';
import { AccountMenu } from './AccountMenu';

const USER = {
  name: 'Chinwe Okafor',
  email: 'chinwe.okafor@gtbank.ng',
  bank: 'GTBank Lagos',
  role: 'Credit Officer',
};

const Brand = (
  <div className="flex items-center gap-2">
    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-500 text-white">
      <IconBank className="!h-4 !w-4" />
    </div>
    <div className="flex flex-col leading-tight">
      <span className="text-sm font-semibold text-ink">Forge</span>
      <span className="text-[10px] uppercase tracking-wider text-ink-muted">Lender</span>
    </div>
  </div>
);

const SidebarFooter = (
  <div className="flex items-center gap-2.5">
    <Avatar name={USER.bank} size="sm" />
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-medium text-ink">{USER.bank}</p>
      <p className="truncate text-[10px] text-ink-muted">{USER.email}</p>
    </div>
  </div>
);

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <PageShell
      sidebar={<Sidebar brand={Brand} sections={bankNav} footer={SidebarFooter} />}
      topBar={
        <TopBar
          search={
            <Input
              type="search"
              placeholder="Search borrowers, loans, applications…"
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
                bankName={USER.bank}
                role={USER.role}
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
