import { z } from 'zod';
import { JobStatusSchema } from '@forge/types';

const ActivityEventTypeSchema = z.enum([
  'job_posted',
  'application_received',
  'worker_clocked_in',
  'job_completed',
  'payment_processed',
  'worker_late',
  'photo_proof_uploaded',
]);

const ActivityEventSchema = z.object({
  id: z.string(),
  type: ActivityEventTypeSchema,
  occurredAt: z.string(),
  title: z.string(),
  detail: z.string().optional(),
  workerName: z.string().optional(),
  amountNaira: z.number().optional(),
});

const MetricSchema = z
  .object({
    key: z.string().optional(),
    label: z.string().optional(),
    value: z.number(),
    deltaPct: z.number().optional(),
    trend: z.array(z.number()).optional(),
  })
  .passthrough();

const LiveJobPinSchema = z
  .object({
    id: z.string(),
    lat: z.number(),
    lng: z.number(),
    status: z.string(),
    title: z.string().optional(),
    neighborhood: z.string().optional(),
  })
  .passthrough();

const AttentionItemSchema = z.object({
  kind: z.string(),
  count: z.number(),
  href: z.string(),
  label: z.string().optional(),
});

const CashPositionSchema = z.object({
  walletBalanceNaira: z.number(),
  projectedWeeklySpendNaira: z.number(),
  spendTrend7d: z.array(
    z.object({
      amount: z.number(),
      day: z.string().optional(),
      date: z.string().optional(),
    }),
  ),
});

const CreditHealthSchema = z.object({
  score: z.number(),
  deltaPoints: z.number().optional(),
  topFactors: z
    .array(
      z.object({
        label: z.string(),
        delta: z.number().optional(),
        points: z.number().optional(),
      }),
    )
    .optional(),
  eligibility: z
    .union([
      z.string(),
      z.object({
        summary: z.string().optional(),
        line: z.string().optional(),
        amountNaira: z.number().optional(),
        aprPct: z.number().optional(),
      }),
    ])
    .optional(),
});

const StartingSoonJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  payNaira: z.number(),
  scheduledStartAt: z.string(),
  neighborhood: z.string().optional(),
  location: z
    .object({
      neighborhood: z.string().optional(),
    })
    .optional(),
});

export const EmployerOverviewSchema = z
  .object({
    metrics: z.array(MetricSchema).default([]),
    liveJobs: z.array(LiveJobPinSchema).default([]),
    attention: z.array(AttentionItemSchema).default([]),
    cashPosition: CashPositionSchema.optional(),
    creditHealth: CreditHealthSchema.optional(),
    startingSoon: z.array(StartingSoonJobSchema).default([]),
    recentActivity: z.array(ActivityEventSchema).optional(),
  })
  .passthrough();

export type EmployerOverview = z.infer<typeof EmployerOverviewSchema>;

export function parseJobStatus(status: string): z.infer<typeof JobStatusSchema> {
  const parsed = JobStatusSchema.safeParse(status);
  return parsed.success ? parsed.data : 'open';
}
