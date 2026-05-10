import Link from 'next/link';
import { Avatar, Badge } from '@forge/ui';
import { formatCurrency, formatRelativeTime } from '@forge/ui/utils';
import { IconClock, IconLocation } from '@forge/ui/icons';
import type { Job } from '@forge/types';
import { MOCK_WORKERS } from '@forge/mock-data';
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from '../lib/jobUtils';

export function JobCard({ job }: { job: Job }) {
  const worker = job.assignedWorkerId
    ? MOCK_WORKERS.find((w) => w.id === job.assignedWorkerId)
    : null;
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-lg border border-outline bg-surface p-3 transition-colors hover:border-outline hover:bg-surface-container-high hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium text-neutral-900">{job.title}</p>
        <Badge tone={JOB_STATUS_TONE[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
        <span className="font-medium text-neutral-900 tabular-nums" data-numeric>
          {formatCurrency(job.payNaira)}
        </span>
        <span className="inline-flex items-center gap-1">
          <IconLocation className="!h-3 !w-3" />
          {job.location.neighborhood}
        </span>
        <span className="inline-flex items-center gap-1">
          <IconClock className="!h-3 !w-3" />
          {formatRelativeTime(job.postedAt)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        {worker ? (
          <div className="flex items-center gap-2">
            <Avatar name={worker.fullName} size="sm" />
            <span className="text-xs text-neutral-600">{worker.fullName}</span>
          </div>
        ) : (
          <span className="text-xs text-neutral-400">
            {job.applicationsCount > 0 ? `${job.applicationsCount} applications` : 'Awaiting applications'}
          </span>
        )}
      </div>
    </Link>
  );
}
