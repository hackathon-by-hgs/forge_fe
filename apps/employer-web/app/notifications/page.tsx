'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, PageHeader } from '@forge/ui';
import { formatRelativeTime } from '@forge/ui/utils';
import type { components } from '@forge/types/api';
import { api, ApiError } from '../../lib/api';
import { mapDashboardNotification, type AppNotification } from '../../lib/notifications';

type NotificationsListResponseDto = components['schemas']['NotificationsListResponseDto'];

const PAGE_SIZE = 25;

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const listKey = ['notifications', 'list', { page, pageSize: PAGE_SIZE }] as const;

  const listQuery = useQuery({
    queryKey: listKey,
    queryFn: () =>
      api.get<NotificationsListResponseDto>(
        `/v1/notifications?page=${page}&pageSize=${PAGE_SIZE}`,
      ),
  });

  const markOneRead = useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.post<unknown>(`/v1/notifications/${id}/read`);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return;
        throw e;
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const prev = queryClient.getQueryData<NotificationsListResponseDto>(listKey);
      queryClient.setQueryData<NotificationsListResponseDto>(listKey, (old) =>
        old
          ? {
              ...old,
              data: old.data.map((n) => (n.id === id ? { ...n, unread: false } : n)),
            }
          : old,
      );
      queryClient.setQueryData<number | undefined>(
        ['notifications', 'unread-count'],
        (old) => (typeof old === 'number' ? Math.max(0, old - 1) : old),
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(listKey, ctx.prev);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await api.post<unknown>('/v1/notifications/mark-all-read');
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const prev = queryClient.getQueryData<NotificationsListResponseDto>(listKey);
      queryClient.setQueryData<NotificationsListResponseDto>(listKey, (old) =>
        old ? { ...old, data: old.data.map((n) => ({ ...n, unread: false })) } : old,
      );
      queryClient.setQueryData(['notifications', 'unread-count'], 0);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(listKey, ctx.prev);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const rows: AppNotification[] = listQuery.data?.data.map(mapDashboardNotification) ?? [];
  const pagination = listQuery.data?.pagination;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Everything that needs your attention, newest first."
        actions={
          rows.some((r) => r.unread) ? (
            <Button variant="secondary" size="sm" onClick={() => void markAllRead.mutateAsync()}>
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
              <p className="text-sm font-medium text-danger-600">Couldn’t load notifications</p>
              <p className="mt-1 text-xs text-neutral-600">
                {listQuery.error instanceof Error ? listQuery.error.message : 'Unknown error'}
              </p>
              <Button className="mt-3" variant="secondary" onClick={() => void listQuery.refetch()}>
                Retry
              </Button>
            </CardBody>
          </Card>
        ) : null}

        {!listQuery.isLoading && !listQuery.isError && rows.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-neutral-600">You have no notifications yet.</p>
            </CardBody>
          </Card>
        ) : null}

        {!listQuery.isLoading && !listQuery.isError && rows.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>All notifications</CardTitle>
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
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900">{n.title}</p>
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
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900">{n.title}</p>
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
