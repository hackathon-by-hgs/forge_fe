'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@forge/ui';
import { formatRelativeTime } from '@forge/ui/utils';
import type { components } from '@forge/types/api';
import { request } from '../../../lib/api/client';
import {
  mapDashboardNotification,
  type AppNotification,
} from '../../../lib/notifications';

type NotificationsListResponseDto = components['schemas']['NotificationsListResponseDto'];

const PAGE_SIZE = 25;

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['notifications', 'list', { page, pageSize: PAGE_SIZE }],
    queryFn: () =>
      request<NotificationsListResponseDto>(
        '/v1/notifications',
        { query: `page=${page}&pageSize=${PAGE_SIZE}` },
      ),
  });

  const markOneRead = useMutation({
    mutationFn: (id: string) =>
      request<void>(`/v1/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () =>
      request<void>('/v1/notifications/mark-all-read', { method: 'POST' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const rows: AppNotification[] =
    listQuery.data?.data.map(mapDashboardNotification) ?? [];
  const pagination = listQuery.data?.pagination;

  return (
    <>
      <PageHeader
        title="Activity"
        description="Every event that touched your portfolio, newest first."
        actions={
          rows.some((r) => r.unread) ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void markAllRead.mutateAsync()}
              disabled={markAllRead.isPending}
            >
              Mark all read
            </Button>
          ) : null
        }
      />

      <div className="p-6">
        {listQuery.isLoading ? (
          <div className="h-40 animate-pulse rounded-xl bg-surface-container-high" />
        ) : null}

        {listQuery.isError ? (
          <Card>
            <CardBody>
              <p className="text-sm font-medium text-danger-600">
                Couldn&apos;t load notifications
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                {listQuery.error instanceof Error
                  ? listQuery.error.message
                  : 'Unknown error'}
              </p>
              <Button
                className="mt-3"
                variant="secondary"
                onClick={() => void listQuery.refetch()}
              >
                Retry
              </Button>
            </CardBody>
          </Card>
        ) : null}

        {!listQuery.isLoading && !listQuery.isError && rows.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-neutral-600">
                No activity yet. Once your portfolio is live, every disbursement, repayment, and risk change will land here.
              </p>
            </CardBody>
          </Card>
        ) : null}

        {!listQuery.isLoading && !listQuery.isError && rows.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>All activity</CardTitle>
              {pagination ? (
                <Badge tone="neutral">
                  Page {pagination.page} of {pagination.totalPages}
                </Badge>
              ) : null}
            </CardHeader>
            <CardBody className="p-0">
              <ul className="divide-y divide-outline-variant">
                {rows.map((n) => (
                  <li key={n.id}>
                    {n.href ? (
                      <Link
                        href={n.href}
                        className="flex items-start justify-between gap-4 px-4 py-3 hover:bg-surface-container"
                        onClick={() => {
                          if (n.unread) void markOneRead.mutateAsync(n.id);
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <p className="text-sm font-medium text-neutral-900">
                              {n.title}
                            </p>
                            {n.unread ? (
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500"
                                aria-label="Unread"
                              />
                            ) : null}
                          </div>
                          <p className="text-xs text-neutral-600">{n.detail}</p>
                        </div>
                        <span className="shrink-0 text-xs text-neutral-400">
                          {formatRelativeTime(n.occurredAt)}
                        </span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-surface-container"
                        onClick={() => {
                          if (n.unread) void markOneRead.mutateAsync(n.id);
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <p className="text-sm font-medium text-neutral-900">
                              {n.title}
                            </p>
                            {n.unread ? (
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500"
                                aria-label="Unread"
                              />
                            ) : null}
                          </div>
                          <p className="text-xs text-neutral-600">{n.detail}</p>
                        </div>
                        <span className="shrink-0 text-xs text-neutral-400">
                          {formatRelativeTime(n.occurredAt)}
                        </span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {pagination && pagination.totalPages > 1 ? (
                <div className="flex items-center justify-between border-t border-outline-variant px-4 py-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-neutral-500">
                    {pagination.total.toLocaleString('en-NG')} total
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
}
