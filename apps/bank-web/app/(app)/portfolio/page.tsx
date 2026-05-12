'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  AlertBanner,
  AreaChart,
  Badge,
  BarChart,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DonutChart,
  MetricTile,
  PageHeader,
  Skeleton,
} from '@forge/ui';
import { IconExternal } from '@forge/ui/icons';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '@forge/ui/utils';
import {
  fetchAllBankLoans,
  fetchRiskRadar,
  type BankPortfolioMetricsDto,
} from '../../../lib/api/bankApi';
import { NetworkError, toUserMessage } from '../../../lib/api/errors';
import {
  buildBorrowerMix,
  buildCohortByBorrowerType,
  buildCohortByScoreBand,
  buildRiskMix,
  buildStatusComposition,
  buildWeekDisbursementSeries,
  derivePortfolioMetricsFromLoans,
  liveLoans,
  weekOverWeekChangePct,
} from '../../../lib/portfolio/aggregateFromLoans';
import { RISK_TONE, STATUS_LABEL, STATUS_TONE } from '../../../lib/loanUtils';

function pickMetrics(
  radarSuccess: boolean,
  radarPortfolio: BankPortfolioMetricsDto | undefined,
  loansBook: Parameters<typeof derivePortfolioMetricsFromLoans>[0],
): BankPortfolioMetricsDto {
  if (radarSuccess && radarPortfolio) {
    return radarPortfolio;
  }
  return derivePortfolioMetricsFromLoans(loansBook);
}

export default function PortfolioPage() {
  const [radarQ, loansQ] = useQueries({
    queries: [
      {
        queryKey: ['bank', 'risk-radar'],
        queryFn: fetchRiskRadar,
        staleTime: 30_000,
        retry: false,
      },
      {
        queryKey: ['bank', 'portfolio', 'loan-book'],
        queryFn: fetchAllBankLoans,
        staleTime: 60_000,
        retry: false,
      },
    ],
  });

  const loans = useMemo(() => loansQ.data ?? [], [loansQ.data]);
  const radarPortfolio = radarQ.data?.portfolio;
  const metrics = useMemo(
    () => pickMetrics(Boolean(radarQ.isSuccess && radarQ.data), radarPortfolio, loans),
    [radarQ.isSuccess, radarQ.data, radarPortfolio, loans],
  );

  const live = useMemo(() => liveLoans(loans), [loans]);
  const weeks = useMemo(() => buildWeekDisbursementSeries(loans, 8), [loans]);
  const riskMix = useMemo(() => buildRiskMix(loans), [loans]);
  const borrowerMix = useMemo(() => buildBorrowerMix(loans), [loans]);
  const statusMix = useMemo(() => buildStatusComposition(loans), [loans]);
  const cohortByType = useMemo(() => buildCohortByBorrowerType(loans), [loans]);
  const cohortByScore = useMemo(() => buildCohortByScoreBand(loans), [loans]);

  const totalCollected = useMemo(
    () =>
      loans
        ?.filter((l) => l?.status === 'repaid')
        ?.reduce((s, l) => s + (l?.principalNaira ?? 0), 0) ?? 0,
    [loans],
  );

  const writeOffs = useMemo(
    () =>
      loans
        ?.filter((l) => l?.status === 'defaulted' || l?.status === 'written_off')
        ?.reduce((s, l) => s + (l?.outstandingNaira ?? 0), 0) ?? 0,
    [loans],
  );

  const topLive = useMemo(() => {
    const sorted = [...live].sort(
      (a, b) => (b?.outstandingNaira ?? 0) - (a?.outstandingNaira ?? 0),
    );
    return sorted[0];
  }, [live]);

  const disbursementTrend = useMemo(
    () => weeks?.map((w) => w?.disbursedNaira ?? 0) ?? [],
    [weeks],
  );
  const hasDisbursementTrend = disbursementTrend.some((v) => v > 0);
  const wowPct = weekOverWeekChangePct(weeks);

  const radarErr = radarQ.error;
  const loansErr = loansQ.error;
  const bothFailed = Boolean(radarQ.isError && loansQ.isError);
  const initialLoading =
    !radarQ.data &&
    !loansQ.data &&
    (radarQ.isPending || loansQ.isPending);
  const refreshing =
    (Boolean(radarQ.data) && radarQ.isFetching && !radarQ.isPending) ||
    (Boolean(loansQ.data) && loansQ.isFetching && !loansQ.isPending);

  if (initialLoading) {
    return (
      <>
        <PageHeader
          title="Portfolio"
          description="Loading portfolio metrics and loan book from the server…"
        />
        <p className="sr-only" role="status">
          Loading portfolio data.
        </p>
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </>
    );
  }

  if (bothFailed) {
    const err = radarErr ?? loansErr;
    const offline = err instanceof NetworkError;
    return (
      <>
        <PageHeader title="Portfolio" description="Composition and performance across your book." />
        <div className="p-6">
          <AlertBanner
            tone="danger"
            title={offline ? 'Cannot reach the server' : 'Couldn’t load portfolio'}
            description={
              offline
                ? 'Check your connection and try again.'
                : `${toUserMessage(radarErr)} · ${toUserMessage(loansErr)}`
            }
            action={
              <Button
                size="sm"
                variant="secondary"
                loading={radarQ.isFetching || loansQ.isFetching}
                onClick={() => {
                  void radarQ.refetch();
                  void loansQ.refetch();
                }}
              >
                Retry
              </Button>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Composition, performance, and concentration — the whole book in one view."
        actions={
          <>
            <Button variant="secondary" disabled>
              Snapshot CSV
            </Button>
            <Button
              variant="secondary"
              leadingIcon={<IconExternal className="!h-4 !w-4" />}
              disabled
            >
              Open in attribution
            </Button>
          </>
        }
      />

      <div className="space-y-4 p-6">
        {refreshing ? (
          <p className="text-sm text-neutral-500" role="status" aria-live="polite">
            Refreshing portfolio data…
          </p>
        ) : null}

        {radarQ.isError ? (
          <AlertBanner
            tone="warning"
            title="Live KPIs unavailable"
            description={`${toUserMessage(radarErr)} Numbers below the chart use the loan list only — they may differ slightly from the bank dashboard aggregate.`}
            action={
              <Button
                size="sm"
                variant="secondary"
                loading={radarQ.isFetching}
                onClick={() => void radarQ.refetch()}
              >
                Retry KPIs
              </Button>
            }
          />
        ) : null}

        {loansQ.isError ? (
          <AlertBanner
            tone="warning"
            title="Charts use limited data"
            description={`${toUserMessage(loansErr)} Charts and cohort tables need the full loan book. KPIs from the risk radar may still be shown.`}
            action={
              <Button
                size="sm"
                variant="secondary"
                loading={loansQ.isFetching}
                onClick={() => void loansQ.refetch()}
              >
                Retry loan book
              </Button>
            }
          />
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Total disbursed"
            value={formatCurrency(metrics?.disbursedTotalNaira ?? 0, { compact: true })}
            hint="From bank aggregate when available"
            trend={hasDisbursementTrend ? disbursementTrend : undefined}
          />
          <MetricTile
            label="Outstanding"
            value={formatCurrency(metrics?.outstandingTotalNaira ?? 0, { compact: true })}
            hint={`${formatNumber((metrics?.activeCount ?? 0) + (metrics?.atRiskCount ?? 0))} live (active + at risk)`}
          />
          <MetricTile
            label="Repayment rate"
            value={formatPercent(metrics?.repaymentRate ?? 0)}
          />
          <MetricTile
            label="Default rate"
            value={formatPercent(metrics?.defaultRate ?? 0)}
            hint={`${formatNumber(metrics?.atRiskCount ?? 0)} at risk`}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Disbursements — last 8 weeks</CardTitle>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Principal disbursed per week from loan <code className="text-[10px]">disbursedAt</code>{' '}
                  timestamps.
                </p>
              </div>
              {wowPct != null && Number.isFinite(wowPct) ? (
                <Badge tone={wowPct >= 0 ? 'success' : 'warning'} variant="soft">
                  {wowPct >= 0 ? '+' : ''}
                  {wowPct.toFixed(1)}% vs prior week
                </Badge>
              ) : (
                <Badge tone="neutral" variant="soft">
                  Week-over-week n/a
                </Badge>
              )}
            </CardHeader>
            <CardBody>
              {loansQ.isError ? (
                <p className="text-sm text-neutral-500">Loan history not loaded.</p>
              ) : weeks?.length ? (
                <AreaChart
                  data={weeks}
                  xKey="week"
                  yKey="disbursedNaira"
                  yFormatter={(v) => formatCurrency(v, { compact: true })}
                />
              ) : (
                <p className="text-sm text-neutral-500">No weekly data.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk mix</CardTitle>
              <p className="text-xs text-neutral-500">{live?.length ?? 0} live</p>
            </CardHeader>
            <CardBody>
              {loansQ.isError ? (
                <p className="text-sm text-neutral-500">—</p>
              ) : (
                <DonutChart
                  data={riskMix}
                  centerLabel="live loans"
                  centerValue={String(live?.length ?? 0)}
                />
              )}
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>By borrower type</CardTitle>
            </CardHeader>
            <CardBody>
              {loansQ.isError ? (
                <p className="text-sm text-neutral-500">—</p>
              ) : (
                <DonutChart
                  data={borrowerMix}
                  centerLabel="live loans"
                  centerValue={String(live?.length ?? 0)}
                />
              )}
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Status composition</CardTitle>
              <p className="text-xs text-neutral-500">{loans?.length ?? 0} total</p>
            </CardHeader>
            <CardBody>
              {loansQ.isError ? (
                <p className="text-sm text-neutral-500">—</p>
              ) : statusMix?.length ? (
                <BarChart
                  data={statusMix}
                  xKey="status"
                  yKey="count"
                  yFormatter={(v) => formatNumber(v)}
                />
              ) : (
                <p className="text-sm text-neutral-500">No loans in the book yet.</p>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Cohort — by borrower type</CardTitle>
                <p className="mt-0.5 text-xs text-neutral-500">
                  How each segment is performing across the book.
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {loansQ.isError ? (
                <p className="text-sm text-neutral-500">—</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="py-2 text-left font-medium">Segment</th>
                      <th className="py-2 text-right font-medium">Loans</th>
                      <th className="py-2 text-right font-medium">Principal</th>
                      <th className="py-2 text-right font-medium">Outstanding</th>
                      <th className="py-2 text-right font-medium">Repaid</th>
                      <th className="py-2 text-right font-medium">Default</th>
                      <th className="py-2 text-right font-medium">On-time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {cohortByType?.map((row) => (
                      <tr key={row?.label ?? ''}>
                        <td className="py-2.5 font-medium text-neutral-900">{row?.label}</td>
                        <td className="py-2.5 text-right tabular-nums" data-numeric>
                          {row?.count ?? 0}
                        </td>
                        <td className="py-2.5 text-right tabular-nums" data-numeric>
                          {formatCurrency(row?.principal ?? 0, { compact: true })}
                        </td>
                        <td className="py-2.5 text-right tabular-nums" data-numeric>
                          {formatCurrency(row?.outstanding ?? 0, { compact: true })}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-success-700" data-numeric>
                          {row?.repaid ?? 0}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-danger-700" data-numeric>
                          {row?.defaulted ?? 0}
                        </td>
                        <td className="py-2.5 text-right tabular-nums" data-numeric>
                          {formatPercent(row?.onTimeRate ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Cohort — by approval score</CardTitle>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Uses approval score when present; otherwise borrower score.
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {loansQ.isError ? (
                <p className="text-sm text-neutral-500">—</p>
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
                    {cohortByScore?.map((row) => {
                      const dr = row?.defaultRate ?? 0;
                      const tone =
                        dr >= 0.1
                          ? 'text-danger-700'
                          : dr >= 0.05
                            ? 'text-warning-700'
                            : 'text-success-700';
                      return (
                        <tr key={row?.label ?? ''}>
                          <td className="py-2.5 font-medium text-neutral-900">{row?.label}</td>
                          <td className="py-2.5 text-right tabular-nums" data-numeric>
                            {row?.count ?? 0}
                          </td>
                          <td className="py-2.5 text-right tabular-nums" data-numeric>
                            {formatCurrency(row?.principal ?? 0, { compact: true })}
                          </td>
                          <td className="py-2.5 text-right tabular-nums" data-numeric>
                            {row?.defaulted ?? 0}
                          </td>
                          <td className={`py-2.5 text-right font-medium tabular-nums ${tone}`} data-numeric>
                            {formatPercent(dr)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Concentration & exposure</CardTitle>
              <p className="mt-0.5 text-xs text-neutral-500">Top exposures and write-off impact.</p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-neutral-200 p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Total collected (lifetime)
                </p>
                <p className="mt-1 text-xl font-semibold text-neutral-900 tabular-nums" data-numeric>
                  {formatCurrency(totalCollected, { compact: true })}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Across {loans?.filter((l) => l?.status === 'repaid')?.length ?? 0} fully repaid loans.
                </p>
              </div>
              <div className="rounded-lg border border-warning-500/30 bg-warning-50/40 p-4">
                <p className="text-xs uppercase tracking-wide text-warning-700">
                  Write-offs & defaults
                </p>
                <p className="mt-1 text-xl font-semibold text-neutral-900 tabular-nums" data-numeric>
                  {formatCurrency(writeOffs, { compact: true })}
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  {loans?.filter((l) => l?.status === 'defaulted')?.length ?? 0} defaulted ·{' '}
                  {loans?.filter((l) => l?.status === 'written_off')?.length ?? 0} written off
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Largest single exposure
                </p>
                {!topLive?.id ? (
                  <p className="mt-1 text-sm text-neutral-500">No live loans.</p>
                ) : (
                  <>
                    <p className="mt-1 text-xl font-semibold text-neutral-900 tabular-nums" data-numeric>
                      {formatCurrency(topLive?.outstandingNaira ?? 0)}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-neutral-600">
                      <Link
                        href={`/loans/${encodeURIComponent(topLive.id)}`}
                        className="font-mono hover:text-accent-600 hover:underline"
                      >
                        {topLive?.id}
                      </Link>
                      {topLive?.riskLevel ? (
                        <Badge tone={RISK_TONE[topLive.riskLevel]} variant="soft">
                          {topLive.riskLevel}
                        </Badge>
                      ) : null}
                      {topLive?.status ? (
                        <Badge tone={STATUS_TONE[topLive.status]} variant="soft">
                          {STATUS_LABEL[topLive.status] ?? topLive.status}
                        </Badge>
                      ) : null}
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
