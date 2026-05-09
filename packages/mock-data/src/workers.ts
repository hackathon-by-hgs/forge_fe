import { subDays, subMonths, formatISO } from 'date-fns';
import type {
  GeoPoint,
  IncomePoint,
  ScoreFactor,
  ScoreHistoryPoint,
  Worker,
  WorkerSkill,
} from '@forge/types';
import { FIRST_NAMES, LAST_NAMES, NEIGHBORHOODS, NEIGHBORHOOD_COORDS } from './fixtures';
import { createRng, pick, range, rangeFloat } from './rng';

const SKILLS: readonly WorkerSkill[] = ['loader', 'driver', 'unloader', 'general'];

function makeWorker(rng: () => number, idx: number): Worker {
  const firstName = pick(rng, FIRST_NAMES);
  const lastName = pick(rng, LAST_NAMES);
  const fullName = `${firstName} ${lastName}`;
  const neighborhood = pick(rng, NEIGHBORHOODS);
  const coords = NEIGHBORHOOD_COORDS[neighborhood];
  const home: GeoPoint = {
    lat: coords.lat + rangeFloat(rng, -0.01, 0.01),
    lng: coords.lng + rangeFloat(rng, -0.01, 0.01),
    neighborhood,
  };
  const score = range(rng, 35, 95);
  const jobsCompleted = range(rng, 4, 220);
  const onTimeRate = rangeFloat(rng, 0.78, 0.99);
  const avgWeekly = range(rng, 8000, 35000);
  const totalEarned = avgWeekly * range(rng, 8, 32);
  const monthsAgo = range(rng, 1, 11);
  const eligibility =
    score >= 80 ? 'pre_approved' : score >= 70 ? 'eligible' : 'ineligible';
  return {
    id: `wkr_${String(idx).padStart(4, '0')}`,
    fullName,
    phone: `+23480${range(rng, 10000000, 99999999)}`,
    avatarUrl: null,
    primarySkill: pick(rng, SKILLS),
    homeLocation: home,
    joinedAt: formatISO(subMonths(new Date(), monthsAgo)),
    reliabilityScore: score,
    jobsCompleted,
    onTimeRate,
    totalEarnedNaira: totalEarned,
    averageWeeklyIncomeNaira: avgWeekly,
    incomeVolatilityPct: rangeFloat(rng, 0.05, 0.25),
    eligibility,
  };
}

/** 50 workers — deterministic. Includes 3 "story" graduates and 3 at-risk. */
export const MOCK_WORKERS: readonly Worker[] = (() => {
  const rng = createRng(0xc0ffee);
  const list: Worker[] = [];
  for (let i = 0; i < 50; i += 1) list.push(makeWorker(rng, i + 1));

  // Promote 3 story workers — high score, growth narrative.
  for (let i = 0; i < 3; i += 1) {
    const w = list[i];
    if (!w) continue;
    list[i] = {
      ...w,
      reliabilityScore: 88 + i,
      jobsCompleted: 120 + i * 15,
      onTimeRate: 0.96 + i * 0.01,
      eligibility: 'pre_approved',
    };
  }
  // Demote 3 at-risk workers.
  for (let i = 47; i < 50; i += 1) {
    const w = list[i];
    if (!w) continue;
    list[i] = {
      ...w,
      reliabilityScore: 42 - (i - 47) * 2,
      onTimeRate: 0.74,
      eligibility: 'ineligible',
    };
  }
  return list;
})();

export function getWorkerById(id: string): Worker | undefined {
  return MOCK_WORKERS.find((w) => w.id === id);
}

export function getScoreHistory(workerId: string): ScoreHistoryPoint[] {
  const worker = getWorkerById(workerId);
  if (!worker) return [];
  const rng = createRng(hashId(workerId));
  const points: ScoreHistoryPoint[] = [];
  const start = Math.max(40, worker.reliabilityScore - range(rng, 25, 40));
  for (let m = 6; m >= 0; m -= 1) {
    const progress = (6 - m) / 6;
    const score = Math.round(
      start + (worker.reliabilityScore - start) * progress + rangeFloat(rng, -2, 2),
    );
    points.push({
      date: formatISO(subMonths(new Date(), m)),
      score,
    });
  }
  if (points[0]) points[0].annotation = 'Joined platform';
  const eligibleIdx = points.findIndex((p) => p.score >= 70);
  if (eligibleIdx > 0 && points[eligibleIdx]) {
    points[eligibleIdx].annotation = 'Crossed 70 — eligible for first loan';
  }
  return points;
}

export function getIncomeHistory(workerId: string): IncomePoint[] {
  const worker = getWorkerById(workerId);
  if (!worker) return [];
  const rng = createRng(hashId(workerId) ^ 0x1234);
  const out: IncomePoint[] = [];
  const baseline = worker.averageWeeklyIncomeNaira;
  for (let w = 26; w >= 0; w -= 1) {
    const variance = rangeFloat(rng, 0.7, 1.3);
    out.push({
      weekStart: formatISO(subDays(new Date(), w * 7)),
      amountNaira: Math.round(baseline * variance),
    });
  }
  return out;
}

export function getScoreFactors(workerId: string): ScoreFactor[] {
  const worker = getWorkerById(workerId);
  if (!worker) return [];
  const rng = createRng(hashId(workerId) ^ 0x5678);
  const trend = (target: number): number[] =>
    Array.from({ length: 12 }, (_, i) =>
      Math.max(0, Math.min(1, target + rangeFloat(rng, -0.05, 0.05) + (i - 11) * 0.005)),
    );
  return [
    {
      key: 'completion_rate',
      label: 'Job Completion Rate',
      value: 0.94 + rangeFloat(rng, -0.04, 0.04),
      weight: 0.4,
      trend: trend(0.94),
      rationale: 'Of jobs accepted, share completed without abandonment.',
    },
    {
      key: 'on_time_rate',
      label: 'On-Time Arrival Rate',
      value: worker.onTimeRate,
      weight: 0.3,
      trend: trend(worker.onTimeRate),
      rationale: 'GPS-verified arrivals at the job site within the scheduled window.',
    },
    {
      key: 'income_consistency',
      label: 'Income Consistency',
      value: Math.max(0, 1 - worker.incomeVolatilityPct),
      weight: 0.2,
      trend: trend(1 - worker.incomeVolatilityPct),
      rationale: 'Lower week-to-week volatility predicts repayment reliability.',
    },
    {
      key: 'time_on_platform',
      label: 'Time on Platform',
      value: Math.min(1, worker.jobsCompleted / 200),
      weight: 0.1,
      trend: trend(0.6),
      rationale: 'Longer tenure provides more verified history to underwrite against.',
    },
  ];
}

function hashId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}
