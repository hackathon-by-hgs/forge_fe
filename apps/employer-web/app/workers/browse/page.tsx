'use client';

import Link from 'next/link';
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  Input,
  PageHeader,
  RoutedTabs,
  Select,
  type DataTableColumn,
} from '@forge/ui';
import { IconFilter, IconSearch } from '@forge/ui/icons';
import { formatCurrency, formatNumber } from '@forge/ui/utils';
import type { Worker } from '@forge/types';
import { MOCK_WORKERS } from '@forge/mock-data';
import { workersTabs } from '../../../lib/nav';

export default function BrowseTalentPage() {
  const all = MOCK_WORKERS;
  const columns: DataTableColumn<Worker>[] = [
    {
      key: 'name',
      header: 'Worker',
      sortBy: (w) => w.fullName,
      cell: (w) => (
        <div className="flex items-center gap-2">
          <Avatar name={w.fullName} size="sm" />
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
      key: 'jobs',
      header: 'Jobs',
      align: 'right',
      sortBy: (w) => w.jobsCompleted,
      cellClassName: 'tabular-nums',
      cell: (w) => formatNumber(w.jobsCompleted),
    },
    {
      key: 'earned',
      header: 'Earned',
      align: 'right',
      sortBy: (w) => w.totalEarnedNaira,
      cellClassName: 'tabular-nums',
      cell: (w) => formatCurrency(w.totalEarnedNaira, { compact: true }),
    },
    {
      key: 'location',
      header: 'Location',
      sortBy: (w) => w.homeLocation.neighborhood,
      cell: (w) => w.homeLocation.neighborhood,
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
            placeholder="Search by name, phone, or skill…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            className="max-w-sm"
          />
          <Select
            aria-label="Skill"
            options={[
              { label: 'All skills', value: 'all' },
              { label: 'Loader', value: 'loader' },
              { label: 'Driver', value: 'driver' },
              { label: 'Unloader', value: 'unloader' },
              { label: 'General', value: 'general' },
            ]}
            className="w-40"
            defaultValue="all"
          />
          <Select
            aria-label="Score"
            options={[
              { label: 'Any score', value: 'all' },
              { label: '80+ (excellent)', value: 'high' },
              { label: '65-79 (good)', value: 'mid' },
              { label: 'Below 65', value: 'low' },
            ]}
            className="w-44"
            defaultValue="all"
          />
          <Button variant="secondary" leadingIcon={<IconFilter className="!h-4 !w-4" />}>
            More filters
          </Button>
        </div>

        <DataTable
          data={all}
          columns={columns}
          rowKey={(w) => w.id}
          emptyTitle="No workers found"
          emptyDescription="Try widening your filters or your job radius."
        />
      </div>
    </>
  );
}
