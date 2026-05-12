import type {
  BankPortfolioMetricsDto,
  LoanDto,
  LoanStatusWire,
} from '../api/bankApi';
import { STATUS_LABEL } from '../loanUtils';

const LIVE: readonly LoanStatusWire[] = ['active', 'at_risk'];

const DISBURSED_LIKE: ReadonlySet<LoanStatusWire> = new Set([
  'active',
  'at_risk',
  'repaid',
  'defaulted',
  'written_off',
]);

function safeNum(n: unknown): number {
  if (typeof n === 'number' && Number.isFinite(n)) return n;
  return 0;
}

/** Fallback KPIs when `/v1/bank/risk-radar` is unavailable — best-effort from the loan book. */
export function derivePortfolioMetricsFromLoans(
  loans: readonly LoanDto[] | null | undefined,
): BankPortfolioMetricsDto {
  const list = loans ?? [];
  if (list.length === 0) {
    return {
      activeCount: 0,
      atRiskCount: 0,
      disbursedTotalNaira: 0,
      outstandingTotalNaira: 0,
      repaymentRate: 0,
      defaultRate: 0,
    };
  }

  const liveLoans = list.filter((l) => LIVE.includes(l?.status as LoanStatusWire));
  const defaulted = list.filter(
    (l) => l?.status === 'defaulted' || l?.status === 'written_off',
  );
  const repaid = list.filter((l) => l?.status === 'repaid');
  const closedOrLive = repaid.length + defaulted.length + liveLoans.length;

  const disbursedTotalNaira = list
    .filter((l) => DISBURSED_LIKE.has((l?.status ?? 'draft') as LoanStatusWire))
    .reduce((s, l) => s + safeNum(l?.principalNaira), 0);

  const outstandingTotalNaira = liveLoans.reduce((s, l) => s + safeNum(l?.outstandingNaira), 0);

  const defaultRate =
    closedOrLive > 0 ? Math.min(1, defaulted.length / Math.max(1, closedOrLive)) : 0;
  const repaymentRate =
    closedOrLive > 0 ? Math.min(1, repaid.length / Math.max(1, closedOrLive)) : 0;

  return {
    activeCount: list.filter((l) => l?.status === 'active').length,
    atRiskCount: list.filter((l) => l?.status === 'at_risk').length,
    disbursedTotalNaira,
    outstandingTotalNaira,
    repaymentRate,
    defaultRate,
  };
}

export interface WeekDisbursementRow {
  week: string;
  disbursedNaira: number;
}

export function buildWeekDisbursementSeries(
  loans: readonly LoanDto[] | null | undefined,
  weekCount = 8,
): WeekDisbursementRow[] {
  const list = loans ?? [];
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return Array.from({ length: weekCount }, (_, i) => {
    const end = now - (weekCount - 1 - i) * weekMs;
    const start = end - weekMs;
    let disbursedNaira = 0;
    for (const l of list) {
      const raw = l?.disbursedAt;
      if (!raw || typeof raw !== 'string') continue;
      const t = Date.parse(raw);
      if (!Number.isFinite(t) || t < start || t >= end) continue;
      disbursedNaira += safeNum(l?.principalNaira);
    }
    const label = new Date(end).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
    });
    return { week: label, disbursedNaira };
  });
}

export function weekOverWeekChangePct(weeks: readonly WeekDisbursementRow[]): number | null {
  if (weeks?.length < 2) return null;
  const a = safeNum(weeks[weeks.length - 1]?.disbursedNaira);
  const b = safeNum(weeks[weeks.length - 2]?.disbursedNaira);
  if (b === 0) return a > 0 ? 100 : null;
  return ((a - b) / b) * 100;
}

export interface NamedCount {
  name: string;
  value: number;
}

export function buildRiskMix(loans: readonly LoanDto[] | null | undefined): NamedCount[] {
  const live = (loans ?? []).filter((l) => LIVE.includes(l?.status as LoanStatusWire));
  return (['green', 'yellow', 'red'] as const).map((r) => ({
    name: r === 'green' ? 'Healthy' : r === 'yellow' ? 'Watch' : 'Critical',
    value: live.filter((l) => l?.riskLevel === r).length,
  }));
}

export function buildBorrowerMix(loans: readonly LoanDto[] | null | undefined): NamedCount[] {
  const live = (loans ?? []).filter((l) => LIVE.includes(l?.status as LoanStatusWire));
  return (['worker', 'business'] as const).map((t) => ({
    name: t === 'worker' ? 'Workers' : 'Businesses',
    value: live.filter((l) => l?.borrowerType === t).length,
  }));
}

export interface StatusBarRow {
  status: string;
  key: LoanStatusWire;
  count: number;
}

export function buildStatusComposition(
  loans: readonly LoanDto[] | null | undefined,
): StatusBarRow[] {
  const keys = Object.keys(STATUS_LABEL) as LoanStatusWire[];
  return keys
    .map((k) => ({
      status: STATUS_LABEL[k] ?? k,
      key: k,
      count: (loans ?? []).filter((l) => l?.status === k).length,
    }))
    .filter((row) => row.count > 0);
}

export interface CohortTypeRow {
  label: string;
  count: number;
  principal: number;
  outstanding: number;
  repaid: number;
  defaulted: number;
  onTimeRate: number;
}

export function buildCohortByBorrowerType(
  loans: readonly LoanDto[] | null | undefined,
): CohortTypeRow[] {
  return (['worker', 'business'] as const).map((t) => {
    const rows = (loans ?? []).filter((l) => l?.borrowerType === t);
    const liveRows = rows.filter((l) => LIVE.includes(l?.status as LoanStatusWire));
    const outstanding = liveRows.reduce((s, l) => s + safeNum(l?.outstandingNaira), 0);
    const principal = rows.reduce((s, l) => s + safeNum(l?.principalNaira), 0);
    const repaid = rows.filter((l) => l?.status === 'repaid').length;
    const defaulted = rows.filter(
      (l) => l?.status === 'defaulted' || l?.status === 'written_off',
    ).length;
    const onTimeRate = rows.length > 0 ? (rows.length - defaulted) / rows.length : 0;
    return {
      label: t === 'worker' ? 'Workers' : 'Businesses',
      count: rows.length,
      principal,
      outstanding,
      repaid,
      defaulted,
      onTimeRate,
    };
  });
}

const SCORE_BANDS: ReadonlyArray<{ label: string; min: number; max: number }> = [
  { label: '90–100', min: 90, max: 100 },
  { label: '80–89', min: 80, max: 89 },
  { label: '70–79', min: 70, max: 79 },
  { label: '60–69', min: 60, max: 69 },
];

export interface CohortScoreRow {
  label: string;
  min: number;
  max: number;
  count: number;
  principal: number;
  defaulted: number;
  defaultRate: number;
}

function approvalScore(l: LoanDto | undefined): number {
  const s = l?.scoreAtApproval;
  if (typeof s === 'number' && Number.isFinite(s)) return s;
  return safeNum(l?.borrower?.score);
}

export function buildCohortByScoreBand(
  loans: readonly LoanDto[] | null | undefined,
): CohortScoreRow[] {
  const list = loans ?? [];
  return SCORE_BANDS.map((band) => {
    const rows = list.filter((l) => {
      const sc = approvalScore(l);
      return sc >= band.min && sc <= band.max;
    });
    const defaulted = rows.filter(
      (l) => l?.status === 'defaulted' || l?.status === 'written_off',
    ).length;
    const principal = rows.reduce((s, l) => s + safeNum(l?.principalNaira), 0);
    const defaultRate = rows.length > 0 ? defaulted / rows.length : 0;
    return { ...band, count: rows.length, principal, defaulted, defaultRate };
  });
}

export function liveLoans(loans: readonly LoanDto[] | null | undefined): LoanDto[] {
  return (loans ?? []).filter((l) => LIVE.includes(l?.status as LoanStatusWire));
}
