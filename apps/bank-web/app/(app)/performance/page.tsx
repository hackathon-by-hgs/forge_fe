'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertBanner,
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
  Skeleton,
} from '@forge/ui';
import { IconExternal } from '@forge/ui/icons';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '@forge/ui/utils';
import {
  fetchAnalyticsAttribution,
  fetchAnalyticsCohorts,
  fetchAnalyticsPeriod,
  fetchAnalyticsVintageCurves,
  type AnalyticsWindowDays,
} from '../../../lib/api/analyticsApi';

type WindowDays = AnalyticsWindowDays;

export default function PerformanceAttributionPage() {
  const [windowDays, setWindowDays] = useState<WindowDays>(90);

  // Four independent queries — each feeds one section of the page. The BE
  // math mirrors what the page used to compute client-side from MOCK_LOANS,
  // so swapping in live data leaves the chart code untouched.
  const periodQuery = useQuery({
    queryKey: ['bank', 'analytics', 'period', windowDays],
    queryFn: () => fetchAnalyticsPeriod({ window: windowDays }),
    retry: false,
  });
  const attributionQuery = useQuery({
    queryKey: ['bank', 'analytics', 'attribution', windowDays],
    queryFn: () => fetchAnalyticsAttribution({ window: windowDays }),
    retry: false,
  });
  const cohortsQuery = useQuery({
    queryKey: ['bank', 'analytics', 'cohorts', windowDays],
    queryFn: () => fetchAnalyticsCohorts({ window: windowDays }),
    retry: false,
  });
  const vintageQuery = useQuery({
    queryKey: ['bank', 'analytics', 'vintage-curves'],
    queryFn: () => fetchAnalyticsVintageCurves(),
    retry: false,
  });

  const period = periodQuery.data;
  const attribution = attributionQuery.data;
  const cohorts = cohortsQuery.data;
  const vintage = vintageQuery.data;

  const repaymentDeltaBps = period?.deltaBps.repaymentRate ?? 0;
  const defaultDeltaBps = period?.deltaBps.defaultRate ?? 0;
  const yieldDeltaBps = period?.deltaBps.netYield ?? 0;

  // Bar chart for "Disbursement mix" reads principal-by-band, which the
  // cohort endpoint already returns alongside count and default stats.
  const disbursementMix = useMemo(
    () =>
      (cohorts?.byScoreBand ?? []).map((b) => ({
        label: b.label,
        principalNaira: b.principalNaira,
      })),
    [cohorts],
  );

  const anyError =
    periodQuery.isError ||
    attributionQuery.isError ||
    cohortsQuery.isError ||
    vintageQuery.isError;

  const firstError =
    periodQuery.error ??
    attributionQuery.error ??
    cohortsQuery.error ??
    vintageQuery.error;

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
        {anyError ? (
          <AlertBanner
            tone="danger"
            title="Couldn’t load analytics"
            description={
              firstError instanceof Error ? firstError.message : 'Unknown error'
            }
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  void periodQuery.refetch();
                  void attributionQuery.refetch();
                  void cohortsQuery.refetch();
                  void vintageQuery.refetch();
                }}
              >
                Retry
              </Button>
            }
          />
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {periodQuery.isLoading ? (
            <>
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </>
          ) : period ? (
            <>
              <MetricTile
                label="Repayment rate"
                value={formatPercent(period.current.repaymentRate)}
                delta={{
                  pct: Math.abs(repaymentDeltaBps) / 100,
                  direction: repaymentDeltaBps >= 0 ? 'up' : 'down',
                  label: `${repaymentDeltaBps >= 0 ? '+' : ''}${repaymentDeltaBps} bps vs prior`,
                }}
              />
              <MetricTile
                label="Default rate"
                value={formatPercent(period.current.defaultRate)}
                delta={{
                  pct: Math.abs(defaultDeltaBps) / 100,
                  // For default rate, "down" is the good direction — flip the
                  // arrow so green points the right way.
                  direction: defaultDeltaBps <= 0 ? 'up' : 'down',
                  label: `${defaultDeltaBps >= 0 ? '+' : ''}${defaultDeltaBps} bps vs prior`,
                }}
              />
              <MetricTile
                label="Net yield (proxy)"
                value={formatPercent(period.current.netYield)}
                delta={{
                  pct: Math.abs(yieldDeltaBps) / 100,
                  direction: yieldDeltaBps >= 0 ? 'up' : 'down',
                  label: `${yieldDeltaBps >= 0 ? '+' : ''}${yieldDeltaBps} bps vs prior`,
                }}
              />
              <MetricTile
                label="Disbursed (window)"
                value={formatCurrency(period.current.principalDisbursedNaira, { compact: true })}
                hint={`${period.current.count} loans · prior ${period.priorMetrics.count}`}
              />
            </>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Repayment-rate attribution</CardTitle>
              <p className="mt-0.5 text-xs text-neutral-500">
                Decomposing the {repaymentDeltaBps >= 0 ? '+' : ''}
                {repaymentDeltaBps} bps move into contributing factors.
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
            {attributionQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : !attribution || attribution.factors.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
                Not enough data in either window to attribute movement.
              </p>
            ) : (
              <ul className="space-y-3">
                {attribution.factors.map((f) => {
                  const pct = Math.min(100, Math.abs(f.bps) / 2);
                  const positive = f.bps >= 0;
                  return (
                    <li key={f.key}>
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
              {cohortsQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
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
                    {(cohorts?.byScoreBand ?? []).map((row) => {
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
                          <td className="py-2.5 text-right tabular-nums" data-numeric>
                            {row.count}
                          </td>
                          <td className="py-2.5 text-right tabular-nums" data-numeric>
                            {formatCurrency(row.principalNaira, { compact: true })}
                          </td>
                          <td className="py-2.5 text-right tabular-nums" data-numeric>
                            {row.defaultedCount}
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
              )}
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
              {cohortsQuery.isLoading ? (
                <Skeleton className="h-48 w-full rounded-md" />
              ) : (
                <BarChart
                  data={disbursementMix}
                  xKey="label"
                  yKey="principalNaira"
                  yFormatter={(v) => formatCurrency(v, { compact: true })}
                />
              )}
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
            {vintageQuery.isLoading ? (
              <Skeleton className="h-60 w-full rounded-md" />
            ) : !vintage || vintage.rows.length === 0 || vintage.cohorts.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
                Not enough cohort data to render vintage curves.
              </p>
            ) : (
              <LineChart
                data={vintage.rows}
                xKey="monthsSince"
                series={vintage.cohorts.map((c) => ({ key: c, label: c }))}
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
            {period ? (
              <span className="text-xs text-neutral-500">
                {formatNumber(period.current.count)} loans
              </span>
            ) : null}
          </CardHeader>
          <CardBody>
            {cohortsQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (cohorts?.statusBreakdown.length ?? 0) === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-500">
                No loans in this window.
              </p>
            ) : (
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
                  {(cohorts?.statusBreakdown ?? []).map((row) => (
                    <tr key={row.status}>
                      <td className="py-2.5 font-medium capitalize text-neutral-900">
                        {row.status.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 text-right tabular-nums" data-numeric>
                        {row.count}
                      </td>
                      <td className="py-2.5 text-right tabular-nums" data-numeric>
                        {formatCurrency(row.principalNaira, { compact: true })}
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
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
