import { z } from 'zod';
import { GeoPointSchema, type Naira } from './common';

export const WorkerSkillSchema = z.enum(['loader', 'driver', 'unloader', 'general']);
export type WorkerSkill = z.infer<typeof WorkerSkillSchema>;

export const WorkerEligibilitySchema = z.enum(['ineligible', 'eligible', 'pre_approved']);
export type WorkerEligibility = z.infer<typeof WorkerEligibilitySchema>;

export const WorkerSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  phone: z.string(),
  avatarUrl: z.string().nullable(),
  primarySkill: WorkerSkillSchema,
  homeLocation: GeoPointSchema,
  joinedAt: z.string().datetime({ offset: true }),
  reliabilityScore: z.number().min(0).max(100),
  jobsCompleted: z.number().int().nonnegative(),
  onTimeRate: z.number().min(0).max(1),
  totalEarnedNaira: z.number().int().nonnegative(),
  averageWeeklyIncomeNaira: z.number().int().nonnegative(),
  incomeVolatilityPct: z.number().min(0),
  eligibility: WorkerEligibilitySchema,
});
export type Worker = z.infer<typeof WorkerSchema>;

export interface ScoreFactor {
  key: 'completion_rate' | 'on_time_rate' | 'income_consistency' | 'time_on_platform';
  label: string;
  value: number;
  weight: number;
  trend: number[];
  rationale: string;
}

export interface ScoreHistoryPoint {
  date: string;
  score: number;
  annotation?: string;
}

export interface IncomePoint {
  weekStart: string;
  amountNaira: Naira;
}

export interface RiskFlag {
  id: string;
  severity: 'warning' | 'danger';
  title: string;
  detail: string;
  raisedAt: string;
}

export interface VerifiedJobRecord {
  jobId: string;
  date: string;
  employerName: string;
  jobType: WorkerSkill;
  amountNaira: Naira;
  locationLabel: string;
  hasPhotoProof: boolean;
}
