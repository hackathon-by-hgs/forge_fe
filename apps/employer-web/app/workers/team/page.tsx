'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertBanner,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  PageHeader,
  Pagination,
  RadialProgress,
  RoutedTabs,
  Select,
  Skeleton,
} from '@forge/ui';
import { IconAdd } from '@forge/ui/icons';
import { workersTabs } from '../../../lib/nav';
import { fetchTeam, type TeamSortBy } from '../../../lib/workersApi';

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

export default function MyTeamPage() {
  const [sortBy, setSortBy] = useState<TeamSortBy>('recent');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);

  const teamQuery = useQuery({
    queryKey: ['employer', 'workers', 'team', { sortBy, page, pageSize }],
    queryFn: () => fetchTeam({ sortBy, page, pageSize }),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const members = teamQuery.data?.data ?? [];
  const pagination = teamQuery.data?.pagination;

  return (
    <>
      <PageHeader
        title="Workers"
        description="Workers you have hired or explicitly saved for faster hiring."
      />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <RoutedTabs items={workersTabs} />
          <Link href="/workers/browse">
            <Button leadingIcon={<IconAdd className="!h-4 !w-4" />} variant="secondary">
              Save more workers
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Sort"
            options={[
              { label: 'Most recent', value: 'recent' },
              { label: 'Most hired', value: 'hired' },
              { label: 'Highest rated', value: 'rating' },
            ]}
            className="w-44"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as TeamSortBy);
              setPage(1);
            }}
          />
        </div>

        {teamQuery.isError ? (
          <AlertBanner
            tone="danger"
            title="Couldn’t load team"
            description={
              teamQuery.error instanceof Error
                ? teamQuery.error.message
                : 'Unknown error'
            }
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void teamQuery.refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : teamQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <Card>
            <CardBody className="text-center text-sm text-neutral-500">
              No saved team yet. Hire a worker twice and they&apos;ll appear here
              automatically — or browse and save someone now.
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {members.map((w) => (
                <Card key={w.id}>
                  <CardBody className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={w.fullName}
                        src={w.photoUrl ?? undefined}
                        size="lg"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/workers/${w.id}`}
                          className="block truncate text-sm font-semibold text-neutral-900 hover:underline"
                        >
                          {w.fullName}
                        </Link>
                        <p className="truncate text-xs text-neutral-500">
                          {w.primarySkill} · {w.homeNeighborhood ?? '—'}
                        </p>
                      </div>
                      <RadialProgress
                        value={w.reliabilityScore}
                        size={48}
                        strokeWidth={5}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>
                        Jobs with you{' '}
                        <span
                          className="font-medium text-neutral-900 tabular-nums"
                          data-numeric
                        >
                          {w.jobsWithEmployer}
                        </span>
                      </span>
                      <Badge tone={w.explicitlyAdded ? 'accent' : 'neutral'} variant="soft">
                        {w.explicitlyAdded ? 'Saved' : 'By hiring'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span className="tabular-nums" data-numeric>
                        {(w.onTimeRate * 100).toFixed(0)}% on-time
                      </span>
                      <span className="tabular-nums" data-numeric>
                        ★ {w.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <Link href="/jobs/new">
                      <Button className="w-full" size="sm">
                        Hire again
                      </Button>
                    </Link>
                  </CardBody>
                </Card>
              ))}
            </div>

            {pagination && pagination.total > pageSize ? (
              <div className="rounded-xl border border-outline bg-surface-container">
                <Pagination
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onPageChange={setPage}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  onPageSizeChange={(ps) => {
                    setPageSize(ps);
                    setPage(1);
                  }}
                  itemLabel="worker"
                  className="border-t-0"
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
