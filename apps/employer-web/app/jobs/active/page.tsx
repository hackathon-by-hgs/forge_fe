'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Input,
  PageHeader,
  RoutedTabs,
  Select,
} from '@forge/ui';
import { IconAdd, IconFilter, IconSearch } from '@forge/ui/icons';
import { jobsTabs } from '../../../lib/nav';
import { listActiveJobs, listJobs, type JobTypeWire } from '../../../lib/jobsApi';
import { ActiveJobsView } from './ActiveJobsView';

const NEIGHBORHOODS = ['Apapa', 'Lekki', 'Ikeja', 'Mile 2'] as const;

export default function JobsActivePage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | JobTypeWire>('all');
  const [neighborhood, setNeighborhood] = useState<'all' | (typeof NEIGHBORHOODS)[number]>('all');

  const activeQuery = useQuery({
    queryKey: ['employer', 'jobs', 'active'],
    queryFn: listActiveJobs,
    refetchInterval: 30_000,
    retry: false,
  });

  const totalQuery = useQuery({
    queryKey: ['employer', 'jobs', 'count'],
    queryFn: () => listJobs({ page: 1, pageSize: 1 }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const filtered = useMemo(() => {
    const rows = activeQuery.data?.data ?? [];
    return rows.filter((j) => {
      if (type !== 'all' && j.type !== type) return false;
      if (neighborhood !== 'all' && j.location.neighborhood !== neighborhood) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          j.title.toLowerCase().includes(q) ||
          j.id.toLowerCase().includes(q) ||
          (j.location.neighborhood ?? '').toLowerCase().includes(q) ||
          (j.assignedWorker?.fullName ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeQuery.data, type, neighborhood, search]);

  const activeCount = activeQuery.data?.data.length ?? 0;
  const totalAll = totalQuery.data?.pagination.total ?? 0;

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Manage every job from posting through verification."
        actions={
          <Link href="/jobs/new">
            <Button leadingIcon={<IconAdd className="!h-4 !w-4" />}>Post a job</Button>
          </Link>
        }
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RoutedTabs items={jobsTabs} />
          <p className="text-xs text-neutral-500">
            <span className="font-medium text-neutral-900 tabular-nums" data-numeric>
              {activeCount}
            </span>{' '}
            active · {totalAll} total
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Search by title, worker, location, or job ID…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            className="max-w-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            aria-label="Filter by job type"
            options={[
              { label: 'All types', value: 'all' },
              { label: 'Loader', value: 'loader' },
              { label: 'Driver', value: 'driver' },
              { label: 'Unloader', value: 'unloader' },
              { label: 'General', value: 'general' },
            ]}
            className="w-40"
            value={type}
            onChange={(e) => setType(e.target.value as 'all' | JobTypeWire)}
          />
          <Select
            aria-label="Filter by location"
            options={[
              { label: 'All locations', value: 'all' },
              ...NEIGHBORHOODS.map((n) => ({ label: n, value: n })),
            ]}
            className="w-44"
            value={neighborhood}
            onChange={(e) =>
              setNeighborhood(e.target.value as 'all' | (typeof NEIGHBORHOODS)[number])
            }
          />
          <Link
            href={`/jobs?${new URLSearchParams({
              ...(search ? { q: search } : {}),
              ...(type !== 'all' ? { type } : {}),
              ...(neighborhood !== 'all' ? { neighborhood } : {}),
            }).toString()}`}
          >
            <Button variant="secondary" leadingIcon={<IconFilter className="!h-4 !w-4" />}>
              All jobs
            </Button>
          </Link>
        </div>

        <ActiveJobsView
          jobs={filtered}
          isLoading={activeQuery.isLoading}
          isError={activeQuery.isError}
          error={activeQuery.error}
          onRetry={() => void activeQuery.refetch()}
        />
      </div>
    </>
  );
}
