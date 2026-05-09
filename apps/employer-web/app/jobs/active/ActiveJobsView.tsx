'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Avatar,
  Badge,
  DataTable,
  EmptyState,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type DataTableColumn,
} from '@forge/ui';
import { formatCurrency, formatRelativeTime } from '@forge/ui/utils';
import { IconBriefcase } from '@forge/ui/icons';
import type { Job } from '@forge/types';
import { MOCK_WORKERS } from '@forge/mock-data';
import { JOB_STATUS_LABEL, JOB_STATUS_TONE, KANBAN_COLUMNS } from '../../../lib/jobUtils';

export function ActiveJobsView({ jobs }: { jobs: readonly Job[] }) {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');

  const columns: DataTableColumn<Job>[] = [
    {
      key: 'title',
      header: 'Job',
      sortBy: (j) => j.title,
      cell: (j) => (
        <Link href={`/jobs/${j.id}`} className="font-medium text-neutral-900 hover:underline">
          {j.title}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortBy: (j) => j.status,
      cell: (j) => (
        <Badge tone={JOB_STATUS_TONE[j.status]}>{JOB_STATUS_LABEL[j.status]}</Badge>
      ),
    },
    {
      key: 'pay',
      header: 'Pay',
      align: 'right',
      sortBy: (j) => j.payNaira,
      cellClassName: 'tabular-nums',
      cell: (j) => formatCurrency(j.payNaira),
    },
    {
      key: 'location',
      header: 'Location',
      sortBy: (j) => j.location.neighborhood,
      cell: (j) => j.location.neighborhood,
    },
    {
      key: 'posted',
      header: 'Posted',
      sortBy: (j) => j.postedAt,
      cell: (j) => (
        <span className="text-neutral-500">{formatRelativeTime(j.postedAt)}</span>
      ),
    },
    {
      key: 'apps',
      header: 'Apps',
      align: 'right',
      sortBy: (j) => j.applicationsCount,
      cellClassName: 'tabular-nums',
      cell: (j) => j.applicationsCount,
    },
    {
      key: 'worker',
      header: 'Worker',
      cell: (j) => {
        const w = j.assignedWorkerId
          ? MOCK_WORKERS.find((wk) => wk.id === j.assignedWorkerId)
          : null;
        return w ? (
          <div className="flex items-center gap-2">
            <Avatar name={w.fullName} size="sm" />
            <span className="text-xs">{w.fullName}</span>
          </div>
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        );
      },
    },
  ];

  return (
    <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'table')}>
      <TabsList>
        <TabsTrigger value="kanban">Board</TabsTrigger>
        <TabsTrigger value="table">Table</TabsTrigger>
      </TabsList>

      <TabsContent value="kanban" className="mt-4">
        {jobs.length === 0 ? (
          <EmptyState
            icon={<IconBriefcase className="!h-5 !w-5" />}
            title="No active jobs"
            description="Post a job to start hiring."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {KANBAN_COLUMNS.map((col) => {
              const items = jobs.filter((j) => j.status === col.status);
              return (
                <div
                  key={col.status}
                  className="flex min-h-[60vh] flex-col gap-2 rounded-xl border border-neutral-200 bg-neutral-50/60 p-2"
                >
                  <div className="flex items-center justify-between px-1.5 py-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                      {col.label}
                    </p>
                    <Badge variant="soft">{items.length}</Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    {items.length === 0 ? (
                      <p className="px-1.5 py-4 text-center text-xs text-neutral-400">
                        Nothing here yet
                      </p>
                    ) : (
                      items.map((j) => {
                        const w = j.assignedWorkerId
                          ? MOCK_WORKERS.find((wk) => wk.id === j.assignedWorkerId)
                          : null;
                        return (
                          <Link
                            key={j.id}
                            href={`/jobs/${j.id}`}
                            className="block rounded-lg border border-neutral-200 bg-white p-2.5 text-sm transition-colors hover:border-neutral-300"
                          >
                            <p className="line-clamp-2 font-medium text-neutral-900">
                              {j.title}
                            </p>
                            <div className="mt-1.5 flex items-center justify-between text-xs text-neutral-500">
                              <span>{j.location.neighborhood}</span>
                              <span
                                className="font-medium text-neutral-900 tabular-nums"
                                data-numeric
                              >
                                {formatCurrency(j.payNaira)}
                              </span>
                            </div>
                            {w ? (
                              <div className="mt-2 flex items-center gap-1.5">
                                <Avatar name={w.fullName} size="sm" />
                                <span className="text-xs text-neutral-600">{w.fullName}</span>
                              </div>
                            ) : j.applicationsCount > 0 ? (
                              <p className="mt-2 text-xs text-info-600">
                                {j.applicationsCount} applications
                              </p>
                            ) : null}
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="table" className="mt-4">
        <DataTable
          data={jobs}
          columns={columns}
          rowKey={(j) => j.id}
          emptyTitle="No active jobs"
          emptyDescription="Post a job to start hiring."
        />
      </TabsContent>
    </Tabs>
  );
}
