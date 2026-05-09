import { type ReactNode } from 'react';
import {
  Avatar,
  Input,
  PageShell,
  Sidebar,
  TopBar,
} from '@forge/ui';
import { IconBank, IconBell, IconCommand, IconSearch } from '@forge/ui/icons';
import { bankNav } from '../lib/nav';

const Brand = (
  <div className="flex items-center gap-2">
    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-500 text-white">
      <IconBank className="!h-4 !w-4" />
    </div>
    <div className="flex flex-col leading-tight">
      <span className="text-sm font-semibold text-neutral-900">FinanceBank</span>
      <span className="text-[10px] uppercase tracking-wider text-neutral-400">Lender</span>
    </div>
  </div>
);

const SidebarFooter = (
  <div className="flex items-center gap-2.5">
    <Avatar name="GTBank Lagos" size="sm" />
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-medium text-neutral-900">GTBank Lagos</p>
      <p className="truncate text-[10px] text-neutral-500">credit.ops@gtbank.ng</p>
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
                <kbd className="hidden items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500 sm:inline-flex">
                  <IconCommand className="!h-3 !w-3" />K
                </kbd>
              }
              className="max-w-md"
            />
          }
          end={
            <>
              <button
                type="button"
                aria-label="Notifications"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100"
              >
                <IconBell className="!h-5 !w-5" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-warning-500" />
              </button>
              <Avatar name="Chinwe Okafor" size="sm" />
            </>
          }
        />
      }
    >
      {children}
    </PageShell>
  );
}
