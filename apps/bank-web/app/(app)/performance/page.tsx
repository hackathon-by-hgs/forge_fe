'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  BarChart,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  LineChart,
  MetricTile,
  PageHeader,
  Select,
} from '@forge/ui';
import { IconExternal } from '@forge/ui/icons';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '@forge/ui/utils';
import type { Loan } from '@forge/types';
import { MOCK_LOANS } from '@forge/mock-data';

type WindowDays = 30 | 60 | 90;

interface AttributionFactor {
  label: string;
  bps: number;
  detail: string;
}

interface VintageRow {
  monthsSince: number;
  [cohortKey: string]: number;
}

const SCORE_BANDS: ReadonlyArray<{ label: string; min: number; max: number }> = [
  { label: '90–100', min: 90, max: 100 },
  { label: '80–89', min: 80, max: 89 },
  { label: '70–79', min: 70, max: 79 },
  { label: '60–69', min: 60, max: 69 },
];

function inWindow(loan: Loan, fromMs: number, toMs: number): boolean {
  if (!loan.disbursedAt) return false;
  const t = new Date(loan.disbursedAt).getTime();
  return t >= fromMs && t < toMs;
}

function cohortKey(loan: Loan): string {
  if (!loan.disbursedAt) return 'unknown';
  const d = new Date(loan.disbursedAt);
  const month = d.getUTCMonth();
  const quarter = Math.floor(month / 3) + 1;
  return `${d.getUTCFullYear()} Q${quarter}`;
}

function monthsBetween(a: Date, b: Date): number {
  return (
    (b.getUTCFullYear() - a.getUTCFullYear()) * 12 +
    (b.getUTCMonth() - a.getUTCMonth())
  );
}

export default function PerformanceAttributionPage() {
  const [windowDays, setWindowDays] = useState<WindowDays>(90);

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const periodFrom = now - windowDays * dayMs;
  const priorFrom = now - windowDays * 2 * dayMs;
  const priorTo = periodFrom;

  const allLoans = MOCK_LOANS;
  const periodLoans = useMemo(
    () => allLoans.filter((l) => inWindow(l, periodFrom, now)),
    [allLoans, periodFrom, now],
  );
  const priorLoans = useMemo(
    () => allLoans.filter((l) => inWindow(l, priorFrom, priorTo)),
    [allLoans, priorFrom, priorTo],
  );

  const periodMetrics = useMemo(() => deriveMetrics(periodLoans), [periodLoans]);
  const priorMetrics = useMemo(() => deriveMetrics(priorLoans), [priorLoans]);

  const repaymentDeltaBps = Math.round(
    (periodMetrics.repaymentRate - priorMetrics.repaymentRate) * 10_000,
  );
  const defaultDeltaBps = Math.round(
    (periodMetrics.defaultRate - priorMetrics.defaultRate) * 10_000,
  );
  const yieldDeltaBps = Math.round(
    (periodMetrics.netYield - priorMetrics.netYield) * 10_000,
  );

  // Attribution decomposition — synthesised from the period's actual movement.
  const attribution = useMemo<AttributionFactor[]>(() => {
    if (periodMetrics.count === 0 || priorMetrics.count === 0) return [];
    const totalBps = repaymentDeltaBps;
    const scoreShift = periodMetrics.avgScoreAtApproval - priorMetrics.avgScoreAtApproval;
    const tenureShift = periodMetrics.avgTermMonths - priorMetrics.avgTermMonths;
    const mixWorker =
      periodMetrics.workerShare - priorMetrics.workerShare;

    const borrowerMixBps = Math.round(scoreShift * 8);
    const policyTighteningBps = Math.round(Math.max(0, scoreShift) * 6);
    const tenureBps = -Math.round(tenureShift * 4);
    const macroBps = Math.round(mixWorker * 18);
    const residualBps =
      totalBps - borrowerMixBps - policyTighteningBps - tenureBps - macroBps;

    return [
      {
        label: 'Better borrower mix',
        bps: borrowerMixBps,
        detail: `Avg score-at-approval moved ${scoreShift >= 0 ? '+' : ''}${scoreShift.toFixed(1)} pts.`,
      },
      {
        label: 'Tighter approval gate',
        bps: policyTighteningBps,
        detail: 'Policy-driven score floor lifted; rejected loans we would previously have approved.',
      },
      {
        label: 'Loan tenure shift',
        bps: tenureBps,
        detail: `Avg term ${tenureShift >= 0 ? '+' : ''}${tenureShift.toFixed(1)} months.`,
      },
      {
        label: 'Borrower mix (workers vs businesses)',
        bps: macroBps,
        detail: `Worker share moved ${mixWorker >= 0 ? '+' : ''}${(mixWorker * 100).toFixed(1)} pts.`,
      },
      {
        label: 'Residual / unexplained',
        bps: residualBps,
        detail: 'Unattributed — macro, seasonality, or model drift.',
      },
    ];
  }, [periodMetrics, priorMetrics, repaymentDeltaBps]);

  // Cohort by score band
  const scoreBandRows = useMemo(
    () =>
      SCORE_BANDS.map((band) => {
        const rows = periodLoans.filter(
          (l) => l.scoreAtApproval >= band.min && l.scoreAtApproval <= band.max,
        );
        const principal = rows.reduce((s, l) => s + l.principalNaira, 0);
        const defaulted = rows.filter(
          (l) => l.status === 'defaulted' || l.status === 'written_off',
        ).length;
        const repaid = rows.filter((l) => l.status === 'repaid').length;
        const defaultRate = rows.length > 0 ? defaulted / rows.length : 0;
        return { ...band, count: rows.length, principal, defaulted, repaid, defaultRate };
      }),
    [periodLoans],
  );

  // Vintage cumulative loss curves — per disbursement quarter.
  const vintageRows = useMemo<VintageRow[]>(() => {
    const cohorts = new Map<string, Loan[]>();
    for (const loan of allLoans) {
      const key = cohortKey(loan);
      if (key === 'unknown') continue;
      const arr = cohorts.get(key) ?? [];
      arr.push(loan);
      cohorts.set(key, arr);
    }
    const sortedKeys = Array.from(cohorts.keys()).sort().slice(-3);
    if (sortedKeys.length === 0) return [];
    const horizon = 12;
    const out: VintageRow[] = [];
    for (let m = 0; m <= horizon; m += 1) {
      const row: VintageRow = { monthsSince: m };
      for (const key of sortedKeys) {
        const cohort = cohorts.get(key) ?? [];
        if (cohort.length === 0) continue;
        const principal = cohort.reduce((s, l) => s + l.principalNaira, 0);
        let defaulted = 0;
        for (const loan of cohort) {
          if (!loan.disbursedAt) continue;
          if (loan.status !== 'defaulted' && loan.status !== 'written_off') continue;
          const sinceMonths = monthsBetween(new Date(loan.disbursedAt), new Date());
          if (sinceMonths >= m) defaulted += loan.outstandingNaira;
        }
        row[key] = principal > 0 ? defaulted / principal : 0;
      }
      out.push(row);
    }
    return out;
  }, [allLoans]);

  const vintageCohorts = useMemo<string[]>(() => {
    if (vintageRows.length === 0) return [];
    const sample = vintageRows[0];
    if (!sample) return [];
    return Object.keys(sample).filter((k) => k !== 'monthsSince');
  }, [vintageRows]);

  return (
    <>
      <PageHeader
        title="Performance Attribution"
        description="What drove the portfolio this period — decomposed."
        actions={
          <>
            <Select
              options={[
                { label: 'Last 30 days', value: '30' },
                { label: 'Last 60 days', value: '60' },
                { label: 'Last 90 days', value: '90' },
              ]}
              value={String(windowDays)}
              onChange={(e) => setWindowDays(Number(e.target.value) as WindowDays)}
              aria-label="Window"
              className="w-40"
            />
            <Button variant="secondary">Export CSV</Button>
            <Button
              variant="secondary"
              leadingIcon={<IconExternal className="!h-4 !w-4" />}
            >
              Open in sandbox
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Repayment rate"
            value={formatPercent(periodMetrics.repaymentRate)}
            delta={{
              pct: Math.abs(repaymentDeltaBps) / 100,
              direction: repaymentDeltaBps >= 0 ? 'up' : 'down',
              label: `${repaymentDeltaBps >= 0 ? '+' : ''}${repaymentDeltaBps} bps vs prior`,
            }}
          />
          <MetricTile
            label="Default rate"
            value={formatPercent(periodMetrics.defaultRate)}
            delta={{
              pct: Math.abs(defaultDeltaBps) / 100,
              direction: defaultDeltaBps <= 0 ? 'up' : 'down',
              label: `${defaultDeltaBps >= 0 ? '+' : ''}${defaultDeltaBps} bps vs prior`,
            }}
          />
          <MetricTile
            label="Net yield (proxy)"
            value={formatPercent(periodMetrics.netYield)}
            delta={{
              pct: Math.abs(yieldDeltaBps) / 100,
              direction: yieldDeltaBps >= 0 ? 'up' : 'down',
              label: `${yieldDeltaBps >= 0 ? '+' : ''}${yieldDeltaBps} bps vs prior`,
            }}
          />
          <MetricTile
            label="Disbursed (window)"
            value={formatCurrency(periodMetrics.principalDisbursed, { compact: true })}
            hint={`${periodMetrics.count} loans · prior ${priorMetrics.count}`}
          />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Repayment-rate attribution</CardTitle>
              <p className="mt-0.5 text-xs text-neutral-500">
                Decomposing the {repaymentDeltaBps >= 0 ? '+' : ''}
                {repaymentDeltaBps} bps move into contributing factors. Synthesised from cohort drift.
              </p>
            </div>
            <Badge
              tone={repaymentDeltaBps >= 0 ? 'success' : 'danger'}
              variant="soft"
            >
              {repaymentDeltaBps >= 0 ? '+' : ''}
              {repaymentDeltaBps} bps total
            </Badge>
          </CardHeader>
          <CardBody>
            {attribution.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
                Not enough data in either window to attribute movement.
              </p>
            ) : (
              <ul className="space-y-3">
                {attribution.map((f) => {
                  const pct = Math.min(100, Math.abs(f.bps) / 2);
                  const positive = f.bps >= 0;
                  return (
                    <li key={f.label}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-medium text-neutral-900">{f.label}</p>
                        <span
                          className={`font-mono text-sm font-semibold tabular-nums ${
                            positive ? 'text-success-700' : 'text-danger-700'
                          }`}
                          data-numeric
                        >
                          {positive ? '+' : ''}
                          {f.bps} bps
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className={`absolute inset-y-0 ${
                              positive ? 'left-1/2 bg-success-500' : 'right-1/2 bg-danger-500'
                            }`}
                            style={{ width: `${pct / 2}%` }}
                          />
                          <div className="absolute inset-y-0 left-1/2 w-px bg-neutral-300" />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">{f.detail}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Cohort — by approval score band</CardTitle>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Default rate by band — the policy gate works when this slopes down.
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="py-2 text-left font-medium">Score band</th>
                    <th className="py-2 text-right font-medium">Loans</th>
                    <th className="py-2 text-right font-medium">Principal</th>
                    <th className="py-2 text-right font-medium">Defaulted</th>
                    <th className="py-2 text-right font-medium">Default rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {scoreBandRows.map((row) => {
                    const tone =
                      row.defaultRate >= 0.1
                        ? 'text-danger-700'
                        : row.defaultRate >= 0.05
                          ? 'text-warning-700'
                          : 'text-success-700';
                    return (
                      <tr key={row.label}>
                        <td className="py-2.5 font-medium text-neutral-900">
                          {row.label}
                        </td>
                        <td
                          className="py-2.5 text-right tabular-nums"
                          data-numeric
                        >
                          {row.count}
                        </td>
                        <td
                          className="py-2.5 text-right tabular-nums"
                          data-numeric
                        >
                          {formatCurrency(row.principal, { compact: true })}
                        </td>
                        <td
                          className="py-2.5 text-right tabular-nums"
                          data-numeric
                        >
                          {row.defaulted}
                        </td>
                        <td
                          className={`py-2.5 text-right font-medium tabular-nums ${tone}`}
                          data-numeric
                        >
                          {formatPercent(row.defaultRate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Disbursement mix — this window</CardTitle>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Where new principal landed in the {windowDays}-day window.
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <BarChart
                data={periodMetrics.byScoreBand}
                xKey="label"
                yKey="principalNaira"
                yFormatter={(v) => formatCurrency(v, { compact: true })}
              />
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Vintage curves — cumulative loss</CardTitle>
              <p className="mt-0.5 text-xs text-neutral-500">
                Cumulative defaulted/written-off principal as a % of cohort principal,
                by months since disbursement. Newer cohorts should land below older ones.
              </p>
            </div>
          </CardHeader>
          <CardBody>
            {vintageRows.length === 0 || vintageCohorts.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
                Not enough cohort data to render vintage curves.
              </p>
            ) : (
              <LineChart
                data={vintageRows}
                xKey="monthsSince"
                series={vintageCohorts.map((c) => ({ key: c, label: c }))}
                yFormatter={(v) => formatPercent(v)}
                xFormatter={(v) => `${v as number}m`}
                height={260}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Status mix — this window</CardTitle>
            </div>
            <span className="text-xs text-neutral-500">
              {formatNumber(periodMetrics.count)} loans
            </span>
          </CardHeader>
          <CardBody>
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="py-2 text-left font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Count</th>
                  <th className="py-2 text-right font-medium">Principal</th>
                  <th className="py-2 text-right font-medium">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {periodMetrics.statusBreakdown.map((row) => (
                  <tr key={row.status}>
                    <td className="py-2.5 font-medium capitalize text-neutral-900">
                      {row.status.replace(/_/g, ' ')}
                    </td>
                    <td
                      className="py-2.5 text-right tabular-nums"
                      data-numeric
                    >
                      {row.count}
                    </td>
                    <td
                      className="py-2.5 text-right tabular-nums"
                      data-numeric
                    >
                      {formatCurrency(row.principal, { compact: true })}
                    </td>
                    <td
                      className="py-2.5 text-right tabular-nums text-neutral-600"
                      data-numeric
                    >
                      {formatPercent(row.share)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

interface DerivedMetrics {
  count: number;
  repaymentRate: number;
  defaultRate: number;
  netYield: number;
  principalDisbursed: number;
  avgScoreAtApproval: number;
  avgTermMonths: number;
  workerShare: number;
  byScoreBand: Array<{ label: string; principalNaira: number }>;
  statusBreakdown: Array<{ status: Loan['status']; count: number; principal: number; share: number }>;
}

function deriveMetrics(loans: readonly Loan[]): DerivedMetrics {
  const count = loans.length;
  if (count === 0) {
    return {
      count: 0,
      repaymentRate: 0,
      defaultRate: 0,
      netYield: 0,
      principalDisbursed: 0,
      avgScoreAtApproval: 0,
      avgTermMonths: 0,
      workerShare: 0,
      byScoreBand: SCORE_BANDS.map((b) => ({ label: b.label, principalNaira: 0 })),
      statusBreakdown: [],
    };
  }
  const principal = loans.reduce((s, l) => s + l.principalNaira, 0);
  const defaulted = loans.filter(
    (l) => l.status === 'defaulted' || l.status === 'written_off',
  );
  const repaymentRate = (count - defaulted.length) / count;
  const defaultRate = defaulted.length / count;
  // Naive net-yield proxy: weighted APR × repayment rate, less write-off drag.
  const weightedApr =
    loans.reduce((s, l) => s + l.apr * l.principalNaira, 0) / Math.max(1, principal);
  const writeOffDrag = defaulted.reduce((s, l) => s + l.outstandingNaira, 0) / Math.max(1, principal);
  const netYield = Math.max(0, weightedApr * repaymentRate - writeOffDrag);

  const avgScoreAtApproval =
    loans.reduce((s, l) => s + l.scoreAtApproval, 0) / count;
  const avgTermMonths =
    loans.reduce((s, l) => s + l.termMonths, 0) / count;
  const workerShare =
    loans.filter((l) => l.borrowerType === 'worker').length / count;

  const byScoreBand = SCORE_BANDS.map((band) => ({
    label: band.label,
    principalNaira: loans
      .filter((l) => l.scoreAtApproval >= band.min && l.scoreAtApproval <= band.max)
      .reduce((s, l) => s + l.principalNaira, 0),
  }));

  const statusGroups = new Map<Loan['status'], { count: number; principal: number }>();
  for (const l of loans) {
    const cur = statusGroups.get(l.status) ?? { count: 0, principal: 0 };
    cur.count += 1;
    cur.principal += l.principalNaira;
    statusGroups.set(l.status, cur);
  }
  const statusBreakdown = Array.from(statusGroups.entries())
    .map(([status, v]) => ({
      status,
      count: v.count,
      principal: v.principal,
      share: v.count / count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    count,
    repaymentRate,
    defaultRate,
    netYield,
    principalDisbursed: principal,
    avgScoreAtApproval,
    avgTermMonths,
    workerShare,
    byScoreBand,
    statusBreakdown,
  };
}
