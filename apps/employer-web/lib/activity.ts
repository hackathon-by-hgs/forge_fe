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
