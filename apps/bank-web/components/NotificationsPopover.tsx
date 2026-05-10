'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@forge/ui';
import {
  IconAlert,
  IconApplications,
  IconBell,
  IconCheck,
  IconNaira,
  IconUser,
  IconWarning,
} from '@forge/ui/icons';
import { formatRelativeTime } from '@forge/ui/utils';
import {
  getMockNotifications,
  type AppNotification,
  type NotificationKind,
} from '../lib/notifications';

const ICON: Record<NotificationKind, React.ReactNode> = {
  application_received: <IconApplications className="!h-3.5 !w-3.5" />,
  loan_at_risk: <IconAlert className="!h-3.5 !w-3.5" />,
  repayment_missed: <IconWarning className="!h-3.5 !w-3.5" />,
  repayment_received: <IconCheck className="!h-3.5 !w-3.5" />,
  borrower_pre_approved: <IconUser className="!h-3.5 !w-3.5" />,
  disbursement_processed: <IconNaira className="!h-3.5 !w-3.5" />,
};

const TONE: Record<NotificationKind, string> = {
  application_received: 'bg-info-50 text-info-600',
  loan_at_risk: 'bg-danger-50 text-danger-600',
  repayment_missed: 'bg-warning-50 text-warning-600',
  repayment_received: 'bg-success-50 text-success-600',
  borrower_pre_approved: 'bg-secondary-50 text-secondary-600',
  disbursement_processed: 'bg-accent-50 text-accent-600',
};

export function NotificationsPopover() {
  const [items, setItems] = useState<AppNotification[]>(() => getMockNotifications());
  const unreadCount = items.filter((n) => n.unread).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-container-high hover:text-ink"
        >
          <IconBell className="!h-5 !w-5" />
          {unreadCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white tabular-nums">
              {unreadCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0">
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-ink">Activity</p>
            {unreadCount > 0 ? <Badge tone="danger">{unreadCount} new</Badge> : null}
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-medium text-accent-600 hover:text-accent-700"
            >
              Mark all read
            </button>
          ) : null}
        </div>
        <ul className="max-h-[440px] divide-y divide-outline-variant overflow-y-auto">
          {items.map((n) => {
            const body = (
              <>
                <span
                  className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TONE[n.kind]}`}
                >
                  {ICON[n.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    <span className="shrink-0 text-[10px] text-ink-muted">
                      {formatRelativeTime(n.occurredAt)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-ink-muted">{n.detail}</p>
                </div>
                {n.unread ? (
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500"
                    aria-label="Unread"
                  />
                ) : null}
              </>
            );
            return (
              <li key={n.id}>
                {n.href ? (
                  <Link
                    href={n.href}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-container"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 px-4 py-3">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
        <div className="border-t border-outline-variant px-4 py-2 text-center">
          <Link
            href="#"
            className="text-xs font-medium text-accent-600 hover:text-accent-700"
          >
            Open audit log
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
