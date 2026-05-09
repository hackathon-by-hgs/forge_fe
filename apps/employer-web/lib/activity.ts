import { subMinutes, formatISO } from 'date-fns';
import { MOCK_JOBS, MOCK_TRANSACTIONS, MOCK_WORKERS } from '@forge/mock-data';

export type ActivityEventType =
  | 'job_posted'
  | 'application_received'
  | 'worker_clocked_in'
  | 'job_completed'
  | 'payment_processed'
  | 'worker_late'
  | 'photo_proof_uploaded';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  occurredAt: string;
  title: string;
  detail?: string;
  workerName?: string;
  amountNaira?: number;
}

/**
 * Synthesise a recent activity feed from mock entities. Deterministic for
 * SSR consistency — but uses a fixed "now" of `new Date()` at render time,
 * which is fine for a demo.
 */
export function getRecentActivity(): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const now = new Date();

  MOCK_JOBS.slice(0, 4).forEach((job, i) => {
    const worker = MOCK_WORKERS.find((w) => w.id === job.assignedWorkerId);
    events.push({
      id: `act_post_${job.id}`,
      type: 'job_posted',
      occurredAt: formatISO(subMinutes(now, i * 7 + 3)),
      title: 'New job posted',
      detail: `${job.title} · ${job.location.neighborhood}`,
    });
    if (worker) {
      events.push({
        id: `act_clock_${job.id}`,
        type: 'worker_clocked_in',
        occurredAt: formatISO(subMinutes(now, i * 7 + 12)),
        title: 'Worker clocked in',
        detail: `${worker.fullName} arrived at ${job.location.neighborhood}`,
        workerName: worker.fullName,
      });
    }
  });

  MOCK_TRANSACTIONS.slice(0, 3).forEach((t, i) => {
    const worker = MOCK_WORKERS.find((w) => w.id === t.workerId);
    events.push({
      id: `act_pay_${t.id}`,
      type: 'payment_processed',
      occurredAt: formatISO(subMinutes(now, i * 11 + 22)),
      title: 'Payment processed',
      detail: `Paid ${worker?.fullName ?? 'worker'} via Squad`,
      workerName: worker?.fullName,
      amountNaira: t.amountNaira,
    });
  });

  return events.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}
