import type { JobStatus, StatusTone } from '@forge/types';
import type { JobTypeWire } from './jobsApi';

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  applications_in: 'Applications in',
  accepted: 'Accepted',
  in_progress: 'In progress',
  pending_verification: 'Pending verification',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const JOB_STATUS_TONE: Record<JobStatus, StatusTone> = {
  draft: 'neutral',
  open: 'info',
  applications_in: 'info',
  accepted: 'warning',
  in_progress: 'warning',
  pending_verification: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export const KANBAN_COLUMNS: { status: JobStatus; label: string }[] = [
  { status: 'open', label: 'Open' },
  { status: 'applications_in', label: 'Applications in' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'pending_verification', label: 'Pending verification' },
];

export const JOB_TYPE_LABEL: Record<JobTypeWire, string> = {
  loader: 'Loader',
  driver: 'Driver',
  unloader: 'Unloader',
  general: 'General',
};

export const WORKER_SKILL_LABEL: Record<string, string> = {
  loader: 'Loader',
  driver: 'Driver',
  unloader: 'Unloader',
  general: 'General',
};

export function canEditJob(status: JobStatus): boolean {
  return status === 'draft' || status === 'open';
}
export function canPublishJob(status: JobStatus): boolean {
  return status === 'draft';
}
export function canCancelJob(status: JobStatus): boolean {
  return (
    status === 'draft' ||
    status === 'open' ||
    status === 'applications_in' ||
    status === 'accepted'
  );
}
export function canShowProof(status: JobStatus): boolean {
  return status === 'pending_verification' || status === 'completed';
}
export function canGenerateInvoice(status: JobStatus): boolean {
  return status === 'completed';
}

// ── Activity event kinds ────────────────────────────────────────────────────
// Payload field shapes confirmed by BE punch-list reply §1.

export type ActivityEventKind =
  | 'job_posted'
  | 'job_published'
  | 'job_cancelled'
  | 'audience_flipped'
  | 'application_received'
  | 'application_accepted'
  | 'application_rejected'
  | 'worker_clocked_in'
  | 'worker_late'
  | 'worker_clocked_out'
  | 'photo_proof_uploaded'
  | 'job_completed'
  | 'payment_initiated'
  | 'payment_processed'
  | 'payment_failed';

export interface EventCopy {
  label: string;
  tone: StatusTone;
}

const STATIC_LABEL: Record<string, string> = {
  job_posted: 'Job posted',
  job_published: 'Job published',
  job_cancelled: 'Job cancelled',
  audience_flipped: 'Audience flipped to public',
  application_received: 'Application received',
  application_accepted: 'Application accepted',
  application_rejected: 'Application rejected',
  worker_clocked_in: 'Worker clocked in',
  worker_late: 'Worker running late',
  worker_clocked_out: 'Worker clocked out',
  photo_proof_uploaded: 'Photo proof uploaded',
  job_completed: 'Job completed',
  payment_initiated: 'Payment initiated',
  payment_processed: 'Payment processed',
  payment_failed: 'Payment failed',
};

const TONE: Record<string, StatusTone> = {
  job_posted: 'info',
  job_published: 'info',
  job_cancelled: 'danger',
  audience_flipped: 'info',
  application_received: 'info',
  application_accepted: 'warning',
  application_rejected: 'neutral',
  worker_clocked_in: 'warning',
  worker_late: 'warning',
  worker_clocked_out: 'success',
  photo_proof_uploaded: 'info',
  job_completed: 'success',
  payment_initiated: 'info',
  payment_processed: 'success',
  payment_failed: 'danger',
};

export function describeJobEvent(
  kind: string,
  payload?: Record<string, unknown>,
): EventCopy {
  let label = STATIC_LABEL[kind] ?? kind;
  // Payload-aware enrichment per BE punch-list reply §1.
  if (kind === 'application_rejected' && payload?.reason === 'sibling_accepted') {
    label = 'Application auto-rejected (sibling accepted)';
  } else if (kind === 'job_cancelled' && typeof payload?.reason === 'string' && payload.reason) {
    label = `Job cancelled — ${payload.reason}`;
  } else if (kind === 'worker_clocked_in' && payload?.verified === false) {
    label = 'Worker clocked in (GPS flagged)';
  } else if (kind === 'worker_clocked_out' && payload?.verified === false) {
    label = 'Worker clocked out (GPS flagged)';
  } else if (kind === 'payment_initiated' && typeof payload?.pendingReason === 'string') {
    label = `Payment initiated — pending (${payload.pendingReason as string})`;
  }
  const tone = TONE[kind] ?? 'neutral';
  return { label, tone };
}

export const APPLICATION_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const APPLICATION_STATUS_TONE: Record<string, StatusTone> = {
  pending: 'info',
  accepted: 'success',
  rejected: 'neutral',
  withdrawn: 'neutral',
};
