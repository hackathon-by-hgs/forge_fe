'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@forge/ui';
import {
  IconAlert,
  IconApplications,
  IconBell,
  IconNaira,
} from '@forge/ui/icons';
import { formatRelativeTime } from '@forge/ui/utils';
import type { components } from '@forge/types/api';
import { request } from '../lib/api/client';
import {
  mapDashboardNotification,
  type AppNotification,
  type NotificationKind,
} from '../lib/notifications';

type NotificationsListResponseDto = components['schemas']['NotificationsListResponseDto'];
type UnreadCountDto = components['schemas']['UnreadCountDto'];

const ICON: Record<NotificationKind, React.ReactNode> = {
  application: <IconApplications className="!h-3.5 !w-3.5" />,
  loan: <IconAlert className="!h-3.5 !w-3.5" />,
  payment: <IconNaira className="!h-3.5 !w-3.5" />,
  system: <IconBell className="!h-3.5 !w-3.5" />,
};

const TONE: Record<NotificationKind, string> = {
  application: 'bg-info-50 text-info-600',
  loan: 'bg-warning-50 text-warning-600',
  payment: 'bg-success-50 text-success-600',
  system: 'bg-neutral-100 text-neutral-600',
};

export function NotificationsPopover() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['notifications', 'list', { page: 1, pageSize: 10 }],
    queryFn: () =>
      request<NotificationsListResponseDto>(
        '/v1/notifications',
        { query: 'page=1&pageSize=10' },
      ),
    select: (raw) => raw.data.map(mapDashboardNotification),
  });

  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => request<UnreadCountDto>('/v1/notifications/unread-count'),
    select: (raw) => raw.unreadCount,
    refetchInterval: 60_000,
  });

  const items = listQuery.data ?? [];
  const unreadFromList = items.filter((n) => n.unread).length;
  const unreadCount = unreadQuery.data ?? unreadFromList;

  const markAllRead = useMutation({
    mutationFn: () =>
      request<void>('/v1/notifications/mark-all-read', { method: 'POST' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOneRead = useMutation({
    mutationFn: (id: string) =>
      request<void>(`/v1/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

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
              onClick={() => void markAllRead.mutateAsync()}
              disabled={markAllRead.isPending}
              className="text-xs font-medium text-accent-600 hover:text-accent-700 disabled:opacity-50"
            >
              Mark all read
            </button>
          ) : null}
        </div>

        {listQuery.isLoading ? (
          <p className="px-4 py-6 text-xs text-ink-muted">Loading…</p>
        ) : null}

        {listQuery.isError ? (
          <div className="px-4 py-4">
            <p className="text-xs font-medium text-danger-600">
              Couldn&apos;t load notifications
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              {listQuery.error instanceof Error
                ? listQuery.error.message
                : 'Unknown error'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => void listQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : null}

        {!listQuery.isLoading && !listQuery.isError && items.length === 0 ? (
          <p className="px-4 py-6 text-xs text-ink-muted">No notifications yet.</p>
        ) : null}

        <ul className="max-h-[440px] divide-y divide-outline-variant overflow-y-auto">
          {!listQuery.isLoading && !listQuery.isError
            ? items.map((n: AppNotification) => {
                const row = (
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
                        onClick={() => {
                          if (n.unread) void markOneRead.mutateAsync(n.id);
                        }}
                      >
                        {row}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container"
                        onClick={() => {
                          if (n.unread) void markOneRead.mutateAsync(n.id);
                        }}
                      >
                        {row}
                      </button>
                    )}
                  </li>
                );
              })
            : null}
        </ul>
        <div className="border-t border-outline-variant px-4 py-2 text-center">
          <Link
            href="/notifications"
            className="text-xs font-medium text-accent-600 hover:text-accent-700"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
