'use client';

import { useRouter } from 'next/navigation';
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ThemeToggle,
} from '@forge/ui';
import {
  IconBank,
  IconLogout,
  IconReports,
  IconSettings,
  IconShield,
  IconUser,
} from '@forge/ui/icons';

interface AccountMenuProps {
  userName: string;
  userEmail: string;
  bankName: string;
  role: string;
}

export function AccountMenu({ userName, userEmail, bankName, role }: AccountMenuProps) {
  const router = useRouter();
  const go = (href: string) => () => router.push(href);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open account menu"
          className="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
        >
          <Avatar name={userName} size="sm" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72">
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar name={userName} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{userName}</p>
            <p className="truncate text-xs text-ink-muted">{userEmail}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-ink-muted">
              <IconBank className="!h-3 !w-3" />
              {bankName} · {role}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="text-xs font-medium text-ink-muted">Theme</span>
          <ThemeToggle />
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuItem
          icon={<IconUser className="!h-4 !w-4" />}
          onSelect={go('/settings')}
        >
          My profile
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={<IconSettings className="!h-4 !w-4" />}
          onSelect={go('/settings')}
        >
          Preferences
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={<IconReports className="!h-4 !w-4" />}
          onSelect={go('/reports')}
        >
          My reports
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Compliance</DropdownMenuLabel>
        <DropdownMenuItem icon={<IconShield className="!h-4 !w-4" />}>
          Audit log
        </DropdownMenuItem>
        <DropdownMenuItem>Decision policies</DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="danger"
          icon={<IconLogout className="!h-4 !w-4" />}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
