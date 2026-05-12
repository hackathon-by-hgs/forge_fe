'use client';

import Link from 'next/link';
import { Badge } from '@forge/ui';
import { formatCurrency, formatRelativeTime } from '@forge/ui/utils';
import type { WorkerJobItemDto } from '../../../lib/workersApi';
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from '../../../lib/jobUtils';
import type { JobStatus } from '@forge/types';

export function PastJobsList({ jobs }: { jobs: readonly WorkerJobItemDto[] }) {
  return (
    <ul className="divide-y divide-neutral-100">
      {jobs.map((j) => {
        const status = j.status as JobStatus;
        return (
          <li
            key={j.jobId}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <Link
                href={`/jobs/${j.jobId}`}
                className="block truncate text-sm font-medium text-neutral-900 hover:underline"
              >
                {j.title}
              </Link>
              <p className="text-xs text-neutral-500">
                {j.type} ·{' '}
                {formatRelativeTime(j.completedAt ?? j.scheduledStartAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={JOB_STATUS_TONE[status]}>
                {JOB_STATUS_LABEL[status]}
              </Badge>
              <span
                className="text-sm font-medium text-neutral-900 tabular-nums"
                data-numeric
              >
                {formatCurrency(j.payNaira)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
