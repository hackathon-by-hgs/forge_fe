import { type ReactNode } from 'react';
import {
  PageShell,
  Sidebar,
  TopBar,
} from '@forge/ui';
import { IconBank } from '@forge/ui/icons';
import { bankNav } from '../lib/nav';
import { NotificationsPopover } from './NotificationsPopover';
import { AccountMenu } from './AccountMenu';
import { SidebarUserCard } from './SidebarUserCard';

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

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <PageShell
      sidebar={
        <Sidebar
          brand={Brand}
          sections={bankNav}
          footer={<SidebarUserCard />}
        />
      }
      topBar={
        <TopBar
          end={
            <>
              <NotificationsPopover />
              <AccountMenu />
            </>
          }
        />
      }
    >
      {children}
    </PageShell>
  );
}
