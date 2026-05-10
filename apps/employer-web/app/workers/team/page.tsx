'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  Input,
  PageHeader,
  Pagination,
  RadialProgress,
  RoutedTabs,
  Select,
  paginate,
} from '@forge/ui';
import { IconAdd, IconSearch } from '@forge/ui/icons';
import { MOCK_WORKERS } from '@forge/mock-data';
import { workersTabs } from '../../../lib/nav';

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

export default function MyTeamPage() {
  const team = [...MOCK_WORKERS]
    .filter((w) => w.eligibility !== 'ineligible')
    .sort((a, b) => b.reliabilityScore - a.reliabilityScore);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const visible = paginate(team, page, pageSize);

  return (
    <>
      <PageHeader
        title="Workers"
        description="Live view of every worker on the clock right now."
      />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <RoutedTabs items={workersTabs} />
          <Button leadingIcon={<IconAdd className="!h-4 !w-4" />} variant="secondary">
            Save more workers
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Search team…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            className="max-w-sm"
          />
          <Select
            aria-label="Sort"
            options={[
              { label: 'Most hired', value: 'hired' },
              { label: 'Highest rated', value: 'rating' },
              { label: 'Most recent', value: 'recent' },
            ]}
            className="w-44"
            defaultValue="hired"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((w) => (
            <Card key={w.id}>
              <CardBody className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={w.fullName} size="lg" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/workers/${w.id}`}
                      className="block truncate text-sm font-semibold text-neutral-900 hover:underline"
                    >
                      {w.fullName}
                    </Link>
                    <p className="truncate text-xs text-neutral-500">
                      {w.primarySkill} · {w.homeLocation.neighborhood}
                    </p>
                  </div>
                  <RadialProgress value={w.reliabilityScore} size={48} strokeWidth={5} />
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    Jobs with you{' '}
                    <span className="font-medium text-neutral-900 tabular-nums" data-numeric>
                      {Math.min(w.jobsCompleted, 24)}
                    </span>
                  </span>
                  <Badge tone="success" variant="soft">
                    {(w.onTimeRate * 100).toFixed(0)}% on-time
                  </Badge>
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

        {team.length > pageSize ? (
          <div className="rounded-xl border border-outline bg-surface-container">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={team.length}
              onPageChange={setPage}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={setPageSize}
              itemLabel="worker"
              className="border-t-0"
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
