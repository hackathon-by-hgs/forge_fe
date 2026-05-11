'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertBanner,
  Avatar,
  Badge,
  Button,
  DataTable,
  Input,
  PageHeader,
  Pagination,
  RoutedTabs,
  Select,
  Skeleton,
  type DataTableColumn,
} from '@forge/ui';
import { IconSearch } from '@forge/ui/icons';
import { formatNumber } from '@forge/ui/utils';
import { workersTabs } from '../../../lib/nav';
import type { JobTypeWire } from '../../../lib/jobsApi';
import {
  browseWorkers,
  type WorkerBrowseQuery,
  type WorkerEligibility,
  type WorkerSummaryDto,
} from '../../../lib/workersApi';

const SKILLS: { label: string; value: 'all' | JobTypeWire }[] = [
  { label: 'All skills', value: 'all' },
  { label: 'Loader', value: 'loader' },
  { label: 'Driver', value: 'driver' },
  { label: 'Unloader', value: 'unloader' },
  { label: 'General', value: 'general' },
];

const SCORE_TIERS: { label: string; value: 'all' | 'high' | 'mid' | 'low' }[] = [
  { label: 'Any score', value: 'all' },
  { label: '80+ (excellent)', value: 'high' },
  { label: '65–79 (good)', value: 'mid' },
  { label: 'Below 65', value: 'low' },
];

const ELIGIBILITY: { label: string; value: 'all' | WorkerEligibility }[] = [
  { label: 'Any eligibility', value: 'all' },
  { label: 'Pre-approved', value: 'pre_approved' },
  { label: 'Eligible', value: 'eligible' },
  { label: 'Ineligible', value: 'ineligible' },
];

export default function BrowseTalentPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [skill, setSkill] = useState<'all' | JobTypeWire>('all');
  const [scoreTier, setScoreTier] = useState<'all' | 'high' | 'mid' | 'low'>('all');
  const [eligibility, setEligibility] = useState<'all' | WorkerEligibility>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [skill, scoreTier, eligibility, debouncedSearch, pageSize]);

  const query: WorkerBrowseQuery = useMemo(() => {
    const q: WorkerBrowseQuery = {
      page,
      pageSize,
      q: debouncedSearch || undefined,
      skill: skill === 'all' ? undefined : skill,
      eligibility: eligibility === 'all' ? undefined : eligibility,
    };
    if (scoreTier === 'high') q.scoreMin = 80;
    else if (scoreTier === 'mid') {
      q.scoreMin = 65;
      q.scoreMax = 79;
    } else if (scoreTier === 'low') q.scoreMax = 64;
    return q;
  }, [skill, scoreTier, eligibility, debouncedSearch, page, pageSize]);

  const browseQuery = useQuery({
    queryKey: ['employer', 'workers', 'browse', query],
    queryFn: () => browseWorkers(query),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const rows = browseQuery.data?.data ?? [];
  const pagination = browseQuery.data?.pagination;

  const columns: DataTableColumn<WorkerSummaryDto>[] = [
    {
      key: 'name',
      header: 'Worker',
      sortBy: (w) => w.fullName,
      cell: (w) => (
        <div className="flex items-center gap-2">
          <Avatar name={w.fullName} src={w.photoUrl ?? undefined} size="sm" />
          <Link
            href={`/workers/${w.id}`}
            className="text-sm font-medium text-neutral-900 hover:underline"
          >
            {w.fullName}
          </Link>
        </div>
      ),
    },
    {
      key: 'skill',
      header: 'Primary skill',
      sortBy: (w) => w.primarySkill,
      cell: (w) => <Badge variant="soft">{w.primarySkill}</Badge>,
    },
    {
      key: 'score',
      header: 'Score',
      align: 'right',
      sortBy: (w) => w.reliabilityScore,
      cellClassName: 'tabular-nums',
      cell: (w) => {
        const tone =
          w.reliabilityScore >= 80
            ? 'success'
            : w.reliabilityScore >= 65
              ? 'warning'
              : 'danger';
        return <Badge tone={tone}>{w.reliabilityScore}</Badge>;
      },
    },
    {
      key: 'rating',
      header: 'Rating',
      align: 'right',
      sortBy: (w) => w.averageRating,
      cellClassName: 'tabular-nums',
      cell: (w) => `★ ${w.averageRating.toFixed(1)}`,
    },
    {
      key: 'jobs',
      header: 'Jobs',
      align: 'right',
      sortBy: (w) => w.jobsCompleted,
      cellClassName: 'tabular-nums',
      cell: (w) => formatNumber(w.jobsCompleted),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (w) => w.homeNeighborhood ?? '—',
    },
    {
      key: 'eligibility',
      header: 'Eligibility',
      cell: (w) =>
        w.eligibility === 'pre_approved' ? (
          <Badge tone="success">Pre-approved</Badge>
        ) : w.eligibility === 'eligible' ? (
          <Badge tone="info">Eligible</Badge>
        ) : (
          <Badge>—</Badge>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Workers"
        description="Live view of every worker on the clock right now."
      />
      <div className="space-y-4 p-6">
        <RoutedTabs items={workersTabs} />

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Search by name, neighborhood, or worker id…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            className="max-w-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            aria-label="Skill"
            options={SKILLS}
            className="w-40"
            value={skill}
            onChange={(e) => setSkill(e.target.value as 'all' | JobTypeWire)}
          />
          <Select
            aria-label="Score"
            options={SCORE_TIERS}
            className="w-44"
            value={scoreTier}
            onChange={(e) =>
              setScoreTier(e.target.value as 'all' | 'high' | 'mid' | 'low')
            }
          />
          <Select
            aria-label="Eligibility"
            options={ELIGIBILITY}
            className="w-44"
            value={eligibility}
            onChange={(e) =>
              setEligibility(e.target.value as 'all' | WorkerEligibility)
            }
          />
        </div>

        {browseQuery.isError ? (
          <AlertBanner
            tone="danger"
            title="Couldn’t load workers"
            description={
              browseQuery.error instanceof Error
                ? browseQuery.error.message
                : 'Unknown error'
            }
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void browseQuery.refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : browseQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-outline bg-surface-container">
              <DataTable
                data={rows}
                columns={columns}
                rowKey={(w) => w.id}
                emptyTitle="No workers found"
                emptyDescription="Try widening your filters or your job radius."
              />
            </div>
            {pagination ? (
              <Pagination
                page={pagination.page}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onPageChange={setPage}
                pageSizeOptions={[10, 25, 50, 100]}
                onPageSizeChange={(ps) => {
                  setPageSize(ps);
                  setPage(1);
                }}
                itemLabel="worker"
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
