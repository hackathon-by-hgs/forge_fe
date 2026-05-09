import { Avatar, EmptyState } from '@forge/ui';
import { formatCurrency, formatRelativeTime } from '@forge/ui/utils';
import {
  IconBriefcase,
  IconCheck,
  IconClock,
  IconNaira,
  IconUser,
} from '@forge/ui/icons';
import { type ActivityEvent } from '../lib/activity';

const ICON: Record<ActivityEvent['type'], React.ReactNode> = {
  job_posted: <IconBriefcase className="!h-3.5 !w-3.5" />,
  application_received: <IconUser className="!h-3.5 !w-3.5" />,
  worker_clocked_in: <IconClock className="!h-3.5 !w-3.5" />,
  job_completed: <IconCheck className="!h-3.5 !w-3.5" />,
  payment_processed: <IconNaira className="!h-3.5 !w-3.5" />,
  worker_late: <IconClock className="!h-3.5 !w-3.5" />,
  photo_proof_uploaded: <IconCheck className="!h-3.5 !w-3.5" />,
};

const TONE: Record<ActivityEvent['type'], string> = {
  job_posted: 'bg-info-50 text-info-600',
  application_received: 'bg-info-50 text-info-600',
  worker_clocked_in: 'bg-warning-50 text-warning-600',
  job_completed: 'bg-success-50 text-success-600',
  payment_processed: 'bg-accent-50 text-accent-600',
  worker_late: 'bg-danger-50 text-danger-600',
  photo_proof_uploaded: 'bg-success-50 text-success-600',
};

export function ActivityFeed({ events }: { events: readonly ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={<IconBriefcase className="!h-5 !w-5" />}
        title="No activity yet"
        description="Once you post your first job, the feed lights up here."
      />
    );
  }
  return (
    <ul className="divide-y divide-neutral-100">
      {events.map((event) => (
        <li key={event.id} className="flex items-start gap-3 py-2.5 first:pt-0">
          <span
            className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TONE[event.type]}`}
          >
            {ICON[event.type]}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-neutral-900">{event.title}</p>
              <span className="shrink-0 text-xs text-neutral-400">
                {formatRelativeTime(event.occurredAt)}
              </span>
            </div>
            {event.detail ? (
              <p className="text-xs text-neutral-500">{event.detail}</p>
            ) : null}
            {event.amountNaira ? (
              <p className="text-xs font-medium text-neutral-900 tabular-nums" data-numeric>
                {formatCurrency(event.amountNaira)}
              </p>
            ) : null}
          </div>
          {event.workerName ? <Avatar name={event.workerName} size="sm" /> : null}
        </li>
      ))}
    </ul>
  );
}
