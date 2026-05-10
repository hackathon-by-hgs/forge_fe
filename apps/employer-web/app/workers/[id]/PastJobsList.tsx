'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge, Pagination, paginate } from '@forge/ui';
import { formatCurrency, formatRelativeTime } from '@forge/ui/utils';
import type { Job } from '@forge/types';
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from '../../../lib/jobUtils';

const PAGE_SIZE = 8;

export function PastJobsList({ jobs }: { jobs: readonly Job[] }) {
  const [page, setPage] = useState(1);
  const visible = paginate(jobs, page, PAGE_SIZE);

  return (
    <>
      <ul className="divide-y divide-neutral-100">
        {visible.map((j) => (
          <li
            key={j.id}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <Link
                href={`/jobs/${j.id}`}
                className="block truncate text-sm font-medium text-neutral-900 hover:underline"
              >
                {j.title}
              </Link>
              <p className="text-xs text-neutral-500">
                {j.location.neighborhood} ·{' '}
                {formatRelativeTime(j.completedAt ?? j.postedAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={JOB_STATUS_TONE[j.status]}>
                {JOB_STATUS_LABEL[j.status]}
              </Badge>
              <span
                className="text-sm font-medium text-neutral-900 tabular-nums"
                data-numeric
              >
                {formatCurrency(j.payNaira)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {jobs.length > PAGE_SIZE ? (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={jobs.length}
          onPageChange={setPage}
          itemLabel="job"
          className="-mx-5 mt-3 px-5"
        />
      ) : null}
    </>
  );
}
