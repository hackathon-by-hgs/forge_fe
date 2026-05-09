import type { JobStatus, StatusTone } from '@forge/types';

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

export const WORKER_SKILL_LABEL: Record<string, string> = {
  loader: 'Loader',
  driver: 'Driver',
  unloader: 'Unloader',
  general: 'General',
};
