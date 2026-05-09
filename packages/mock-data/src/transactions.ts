import { formatISO } from 'date-fns';
import type { Transaction, TransactionStatus } from '@forge/types';
import { MOCK_JOBS } from './jobs';
import { createRng, pick, range } from './rng';

const STATUS_DISTRIBUTION: readonly TransactionStatus[] = [
  'completed', 'completed', 'completed', 'completed', 'completed',
  'pending', 'processing', 'failed',
];

export const MOCK_TRANSACTIONS: readonly Transaction[] = (() => {
  const rng = createRng(0xdead);
  const list: Transaction[] = [];
  let counter = 1;
  for (const job of MOCK_JOBS) {
    if (job.status !== 'completed' && job.status !== 'pending_verification') continue;
    if (!job.assignedWorkerId) continue;
    const status = pick(rng, STATUS_DISTRIBUTION);
    const created = job.completedAt ?? job.startedAt ?? job.postedAt;
    list.push({
      id: `txn_${String(counter).padStart(6, '0')}`,
      squadReference: `SQ-${range(rng, 100000000, 999999999)}`,
      employerId: job.employerId,
      workerId: job.assignedWorkerId,
      jobId: job.id,
      amountNaira: job.payNaira,
      status,
      createdAt: created,
      settledAt: status === 'completed' ? formatISO(new Date()) : null,
    });
    counter += 1;
  }
  return list;
})();

export function getTransactionsByEmployer(employerId: string): Transaction[] {
  return MOCK_TRANSACTIONS.filter((t) => t.employerId === employerId);
}

export function getTransactionsByWorker(workerId: string): Transaction[] {
  return MOCK_TRANSACTIONS.filter((t) => t.workerId === workerId);
}
