import Link from 'next/link';
import {
  Button,
  Input,
  PageHeader,
  RoutedTabs,
  Select,
} from '@forge/ui';
import { IconAdd, IconFilter, IconSearch } from '@forge/ui/icons';
import { getActiveJobs, MOCK_JOBS } from '@forge/mock-data';
import { jobsTabs } from '../../../lib/nav';
import { ActiveJobsView } from './ActiveJobsView';

export default function JobsActivePage() {
  const active = getActiveJobs();
  const totalAll = MOCK_JOBS.length;

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
              {active.length}
            </span>{' '}
            active · {totalAll} total
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Search by title, worker, or job ID…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            className="max-w-sm"
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
            defaultValue="all"
          />
          <Select
            aria-label="Filter by location"
            options={[
              { label: 'All locations', value: 'all' },
              { label: 'Apapa', value: 'Apapa' },
              { label: 'Lekki', value: 'Lekki' },
              { label: 'Ikeja', value: 'Ikeja' },
              { label: 'Mile 2', value: 'Mile 2' },
            ]}
            className="w-44"
            defaultValue="all"
          />
          <Button variant="secondary" leadingIcon={<IconFilter className="!h-4 !w-4" />}>
            More filters
          </Button>
        </div>

        <ActiveJobsView jobs={active} />
      </div>
    </>
  );
}
