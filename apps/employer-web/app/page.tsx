'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  MapPlaceholder,
  MetricTile,
  PageHeader,
  RadialProgress,
  StatusDot,
} from '@forge/ui';
import {
  IconAdd,
  IconCredit,
  IconLocation,
  IconUser,
  IconClock,
  IconAlert,
} from '@forge/ui/icons';
import {
  formatCurrency,
  formatNumber,
  formatShortDate,
} from '@forge/ui/utils';
import type { JobStatus } from '@forge/types';
import { ActivityFeed } from '../components/ActivityFeed';
import { JOB_STATUS_TONE } from '../lib/jobUtils';
import { fetchEmployerOverview } from '../lib/employerOverview';
import type { EmployerOverview } from '../lib/employerOverview.schema';
import { parseJobStatus } from '../lib/employerOverview.schema';

function pickMetric(
  metrics: EmployerOverview['metrics'],
  keys: string[],
  fallbackIndex: number,
): EmployerOverview['metrics'][number] | undefined {
  for (const key of keys) {
    const hit = metrics.find((m) => m.key === key);
    if (hit) return hit;
  }
  const labelHit = metrics.find((m) =>
    keys.some((k) => m.label?.toLowerCase().includes(k.replaceAll('_', ' '))),
  );
  if (labelHit) return labelHit;
  return metrics[fallbackIndex];
}

function mapPinTone(status: JobStatus) {
  const tone = JOB_STATUS_TONE[status];
  if (tone === 'success') return 'success' as const;
  if (tone === 'warning') return 'warning' as const;
  if (tone === 'info') return 'info' as const;
  return 'accent' as const;
}

export default function OverviewPage() {
  const overviewQuery = useQuery({
    queryKey: ['employer', 'overview'],
    queryFn: fetchEmployerOverview,
    refetchInterval: 30_000,
  });

  if (overviewQuery.isLoading) {
    return (
      <>
        <PageHeader title="Overview" description="Loading your dashboard…" />
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-[320px] animate-pulse rounded-xl bg-surface-container-high lg:col-span-2" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-container-high" />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (overviewQuery.isError) {
    return (
      <>
        <PageHeader title="Overview" description="Mission control for jobs, workers, and money — right now." />
        <div className="p-6">
          <div className="rounded-lg border border-outline bg-surface p-4">
            <p className="text-sm font-semibold text-neutral-900">Couldn’t load overview</p>
            <p className="mt-1 text-xs text-neutral-600">
              {overviewQuery.error instanceof Error ? overviewQuery.error.message : 'Unknown error'}
            </p>
            <Button className="mt-3" onClick={() => void overviewQuery.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      </>
    );
  }

  const overview = overviewQuery.data;
  if (!overview) {
    return (
      <>
        <PageHeader title="Overview" description="Loading your dashboard…" />
        <div className="p-6">
          <div className="h-40 animate-pulse rounded-xl bg-surface-container-high" />
        </div>
      </>
    );
  }

  const activeJobsMetric = pickMetric(overview.metrics, ['active_jobs', 'activeJobs'], 0);
  const workingMetric = pickMetric(overview.metrics, ['workers_working', 'working_now', 'workingNow'], 1);
  const spendMetric = pickMetric(overview.metrics, ['today_spend', 'todaySpend'], 2);
  const pendingMetric = pickMetric(overview.metrics, ['pending_payments', 'pendingPayments'], 3);

  const activeJobsValue = activeJobsMetric?.value ?? 0;
  const workersWorking = workingMetric?.value ?? 0;
  const todaySpend = spendMetric?.value ?? 0;
  const pendingPayments = pendingMetric?.value ?? 0;

  const pins = overview.liveJobs.slice(0, 18).map((j) => {
    const status = parseJobStatus(j.status);
    return {
      id: j.id,
      lat: j.lat,
      lng: j.lng,
      tone: mapPinTone(status),
    };
  });

  const spendTrend =
    overview.cashPosition?.spendTrend7d?.map((p, idx) => ({
      day: p.day ?? p.date ?? `D${idx + 1}`,
      amount: p.amount,
    })) ?? [];

  const events = (overview.recentActivity ?? []).slice(0, 6);

  const attentionTotal = overview.attention.reduce((s, a) => s + a.count, 0);

  const credit = overview.creditHealth;
  const eligibilityText =
    typeof credit?.eligibility === 'string'
      ? credit.eligibility
      : credit?.eligibility && typeof credit.eligibility === 'object'
        ? credit.eligibility.summary ??
          credit.eligibility.line ??
          (credit.eligibility.amountNaira && credit.eligibility.aprPct
            ? `Eligible for ${formatCurrency(credit.eligibility.amountNaira)} @ ${credit.eligibility.aprPct}% APR`
            : undefined)
        : undefined;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Mission control for jobs, workers, and money — right now."
        actions={
          <>
            <Button variant="secondary">Today</Button>
            <Link href="/jobs/new">
              <Button leadingIcon={<IconAdd className="!h-4 !w-4" />}>Post a job</Button>
            </Link>
          </>
        }
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Live operations map</CardTitle>
                <Badge tone="success" variant="soft">
                  <StatusDot tone="success" pulse /> Live
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-info-500" /> En route
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warning-500" /> In progress
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success-500" /> Completed
                </span>
              </div>
            </CardHeader>
            <CardBody>
              <MapPlaceholder
                pins={pins}
                className="aspect-[16/9]"
                hint={
                  <span className="inline-flex items-center gap-1">
                    <IconLocation className="!h-3 !w-3" />
                    {pins.length} active sites · Lagos
                  </span>
                }
              />
            </CardBody>
          </Card>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <MetricTile
              label={activeJobsMetric?.label ?? 'Active jobs'}
              value={formatNumber(activeJobsValue)}
              delta={
                activeJobsMetric?.deltaPct !== undefined
                  ? {
                      pct: Math.abs(activeJobsMetric.deltaPct),
                      direction: activeJobsMetric.deltaPct >= 0 ? 'up' : 'down',
                      label: 'vs. yesterday',
                    }
                  : undefined
              }
              trend={activeJobsMetric?.trend}
            />
            <MetricTile
              label={workingMetric?.label ?? 'Working now'}
              value={formatNumber(workersWorking)}
              delta={
                workingMetric?.deltaPct !== undefined
                  ? {
                      pct: Math.abs(workingMetric.deltaPct),
                      direction: workingMetric.deltaPct >= 0 ? 'up' : 'down',
                    }
                  : undefined
              }
              trend={workingMetric?.trend}
            />
            <MetricTile
              label={spendMetric?.label ?? "Today's spend"}
              value={formatCurrency(todaySpend, { compact: true })}
              delta={
                spendMetric?.deltaPct !== undefined
                  ? {
                      pct: Math.abs(spendMetric.deltaPct),
                      direction: spendMetric.deltaPct >= 0 ? 'up' : 'down',
                    }
                  : undefined
              }
              trend={spendMetric?.trend}
            />
            <MetricTile
              label={pendingMetric?.label ?? 'Pending payments'}
              value={formatNumber(pendingPayments)}
              delta={
                pendingMetric?.deltaPct !== undefined
                  ? {
                      pct: Math.abs(pendingMetric.deltaPct),
                      direction: pendingMetric.deltaPct >= 0 ? 'up' : 'down',
                      label: 'good',
                    }
                  : undefined
              }
              trend={pendingMetric?.trend}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </CardHeader>
            <CardBody>
              <ActivityFeed events={events} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Needs your attention</CardTitle>
              {attentionTotal > 0 ? <Badge tone="warning">{attentionTotal}</Badge> : null}
            </CardHeader>
            <CardBody>
              {overview.attention.length === 0 ? (
                <p className="text-sm text-neutral-600">You’re all caught up.</p>
              ) : (
                <ul className="-mx-1 space-y-1 text-sm">
                  {overview.attention.map((item) => (
                    <li key={`${item.kind}-${item.href}`}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-neutral-50"
                      >
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-warning-50 text-warning-600">
                          {item.kind.includes('late') ? (
                            <IconAlert className="!h-3.5 !w-3.5" />
                          ) : item.kind.includes('application') ? (
                            <IconUser className="!h-3.5 !w-3.5" />
                          ) : (
                            <IconClock className="!h-3.5 !w-3.5" />
                          )}
                        </span>
                        <span className="flex-1">
                          {item.label ?? item.kind.replaceAll('_', ' ')} · {item.count}
                        </span>
                        <span className="text-xs text-neutral-400">Open</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Cash position</CardTitle>
              <Button variant="ghost" size="sm">
                Top up wallet
              </Button>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <p className="text-xs text-neutral-500">Squad wallet balance</p>
                <p
                  className="mt-1 text-3xl font-semibold text-neutral-900 tabular-nums"
                  data-numeric
                >
                  {formatCurrency(overview.cashPosition?.walletBalanceNaira ?? 0)}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="text-neutral-500">
                    Projected weekly spend{' '}
                    <span className="font-medium text-neutral-900 tabular-nums" data-numeric>
                      {formatCurrency(overview.cashPosition?.projectedWeeklySpendNaira ?? 0)}
                    </span>
                  </span>
                </div>
              </div>
              {spendTrend.length > 0 ? (
                <AreaChart
                  data={spendTrend}
                  xKey="day"
                  yKey="amount"
                  height={140}
                  yFormatter={(v) => formatCurrency(v, { compact: true })}
                />
              ) : (
                <p className="text-xs text-neutral-500">Spend trend will appear once data is available.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business credit health</CardTitle>
              <Link href="/credit">
                <Button variant="ghost" size="sm">
                  Open Credit
                </Button>
              </Link>
            </CardHeader>
            <CardBody>
              {credit ? (
                <div className="flex items-center gap-6">
                  <RadialProgress value={credit.score} label="Score" size={140} />
                  <div className="min-w-0 flex-1 space-y-2 text-sm">
                    <p className="font-medium text-neutral-900">Top factors</p>
                    <ul className="space-y-1.5 text-xs text-neutral-600">
                      {(credit.topFactors ?? []).map((f, idx) => (
                        <li key={`${f.label}-${idx}`} className="flex items-center justify-between">
                          <span>{f.label}</span>
                          <span
                            className={`font-medium tabular-nums ${
                              (f.delta ?? f.points ?? 0) >= 0 ? 'text-success-600' : 'text-danger-600'
                            }`}
                            data-numeric
                          >
                            {(f.delta ?? f.points ?? 0) >= 0 ? '+' : ''}
                            {f.delta ?? f.points ?? 0}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {eligibilityText ? (
                      <Link
                        href="/credit"
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700"
                      >
                        <IconCredit className="!h-3.5 !w-3.5" /> {eligibilityText}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-600">Credit health will appear once scoring is enabled.</p>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Starting soon</CardTitle>
            <Link href="/jobs/active">
              <Button variant="ghost" size="sm">
                View all jobs
              </Button>
            </Link>
          </CardHeader>
          <CardBody>
            {overview.startingSoon.length === 0 ? (
              <p className="text-sm text-neutral-600">No upcoming starts in the next window.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                {overview.startingSoon.slice(0, 4).map((j) => (
                  <Link
                    key={j.id}
                    href={`/jobs/${j.id}`}
                    className="flex items-center justify-between rounded-lg border border-outline p-3 hover:bg-surface-container-high"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">{j.title}</p>
                      <p className="text-xs text-neutral-500">
                        {j.neighborhood ?? j.location?.neighborhood ?? '—'} ·{' '}
                        {formatShortDate(j.scheduledStartAt)}
                      </p>
                    </div>
                    <span
                      className="ml-2 shrink-0 text-sm font-medium text-neutral-900 tabular-nums"
                      data-numeric
                    >
                      {formatCurrency(j.payNaira)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
