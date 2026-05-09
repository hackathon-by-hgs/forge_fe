import { z } from 'zod';
import { GeoPointSchema } from './common';
import { WorkerSkillSchema } from './worker';

export const JobStatusSchema = z.enum([
  'draft',
  'open',
  'applications_in',
  'accepted',
  'in_progress',
  'pending_verification',
  'completed',
  'cancelled',
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const JobSchema = z.object({
  id: z.string(),
  employerId: z.string(),
  title: z.string(),
  description: z.string(),
  type: WorkerSkillSchema,
  payNaira: z.number().int().positive(),
  durationHours: z.number().positive(),
  location: GeoPointSchema,
  status: JobStatusSchema,
  postedAt: z.string().datetime({ offset: true }),
  scheduledStartAt: z.string().datetime({ offset: true }),
  applicationsCount: z.number().int().nonnegative(),
  assignedWorkerId: z.string().nullable(),
  startedAt: z.string().datetime({ offset: true }).nullable(),
  completedAt: z.string().datetime({ offset: true }).nullable(),
});
export type Job = z.infer<typeof JobSchema>;

export interface JobApplication {
  id: string;
  jobId: string;
  workerId: string;
  appliedAt: string;
  distanceMeters: number;
}
