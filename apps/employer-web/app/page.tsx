'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { JOB_STATUS_TONE } from '../lib/jobUtils';
import { fetchEmployerOverview } from '../lib/employerOverview';
import { ApiError } from '../lib/api';

function mapPinTone(status: JobStatus) {
  const tone = JOB_STATUS_TONE[status];
  if (tone === 'success') return 'success' as const;
  if (tone === 'warning') return 'warning' as const;
  if (tone === 'info') return 'info' as const;
  return 'accent' as const;
}

function attentionIcon(kind: 'applications_waiting' | 'starting_soon' | 'worker_late') {
  if (kind === 'worker_late') return <IconAlert className="!h-3.5 !w-3.5" />;
  if (kind === 'applications_waiting') return <IconUser className="!h-3.5 !w-3.5" />;
  return <IconClock className="!h-3.5 !w-3.5" />;
}

export default function OverviewPage() {
  const router = useRouter();
  const overviewQuery = useQuery({
    queryKey: ['employer', 'overview'],
    queryFn: fetchEmployerOverview,
    refetchInterval: 30_000,
    retry: false,
  });

  useEffect(() => {
    const err = overviewQuery.error;
    if (!err || !(err instanceof ApiError)) return;
    if (err.status === 403 && err.code === 'NO_EMPLOYER_SCOPE') {
      router.replace('/onboarding/business');
    }
  }, [overviewQuery.error, router]);

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
    const err = overviewQuery.error;
    if (err instanceof ApiError && err.status === 404) {
      return (
        <>
          <PageHeader title="Overview" description="We couldn’t load your business dashboard." />
          <div className="p-6">
            <div className="rounded-lg border border-outline bg-surface p-4">
              <p className="text-sm font-semibold text-neutral-900">We couldn’t find your business</p>
              <p className="mt-1 text-xs text-neutral-600">
                If you believe this is a mistake, contact support with your account email.
              </p>
              <a
                href="mailto:support@forge.app?subject=Missing%20business%20dashboard"
                className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-outline bg-surface px-3 text-sm font-medium text-neutral-900 hover:bg-surface-container-high"
              >
                Contact support
              </a>
            </div>
          </div>
        </>
      );
    }
    return (
      <>
        <PageHeader title="Overview" description="Mission control for jobs, workers, and money — right now." />
        <div className="p-6">
          <div className="rounded-lg border border-outline bg-surface p-4">
            <p className="text-sm font-semibold text-neutral-900">Couldn’t load overview</p>
            <p className="mt-1 text-xs text-neutral-600">
              {err instanceof Error ? err.message : 'Unknown error'}
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
    return null;
  }

  const { metrics, liveJobs, attention, cashPosition, creditHealth, startingSoon } = overview;

  const pins = liveJobs.slice(0, 50).map((j) => ({
    id: j.id,
    lat: j.lat,
    lng: j.lng,
    tone: mapPinTone(j.status as JobStatus),
  }));

  const spendTrend = cashPosition.spendTrend7d.map((p) => ({
    day: p.day,
    amount: p.amountNaira,
  }));

  const attentionItems = attention.filter((a) => a.count > 0);
  const attentionTotal = attentionItems.reduce((s, a) => s + a.count, 0);

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
              label="Active jobs"
              value={formatNumber(metrics.activeJobs.value)}
              delta={{
                pct: Math.abs(metrics.activeJobs.deltaPct),
                direction: metrics.activeJobs.deltaPct >= 0 ? 'up' : 'down',
                label: 'vs. prior period',
              }}
              trend={metrics.activeJobs.trend}
            />
            <MetricTile
              label="Working now"
              value={formatNumber(metrics.workersWorking.value)}
              delta={{
                pct: Math.abs(metrics.workersWorking.deltaPct),
                direction: metrics.workersWorking.deltaPct >= 0 ? 'up' : 'down',
              }}
              trend={metrics.workersWorking.trend}
            />
            <MetricTile
              label="Today's spend"
              value={formatCurrency(metrics.todaySpendNaira.value, { compact: true })}
              delta={{
                pct: Math.abs(metrics.todaySpendNaira.deltaPct),
                direction: metrics.todaySpendNaira.deltaPct >= 0 ? 'up' : 'down',
              }}
              trend={metrics.todaySpendNaira.trend}
            />
            <MetricTile
              label="Pending payments"
              value={formatNumber(metrics.pendingPayments.value)}
              delta={{
                pct: Math.abs(metrics.pendingPayments.deltaPct),
                direction: metrics.pendingPayments.deltaPct >= 0 ? 'up' : 'down',
                label: 'good',
              }}
              trend={metrics.pendingPayments.trend}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Needs your attention</CardTitle>
            {attentionTotal > 0 ? <Badge tone="warning">{attentionTotal}</Badge> : null}
          </CardHeader>
          <CardBody>
            {attentionItems.length === 0 ? (
              <p className="text-sm text-neutral-600">You’re all caught up.</p>
            ) : (
              <ul className="-mx-1 grid grid-cols-1 gap-1 text-sm md:grid-cols-2 lg:grid-cols-3">
                {attentionItems.map((item) => (
                  <li key={`${item.kind}-${item.href}`}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-neutral-50"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-warning-50 text-warning-600">
                        {attentionIcon(item.kind)}
                      </span>
                      <span className="flex-1">
                        {item.kind === 'applications_waiting' && 'Applications waiting'}
                        {item.kind === 'starting_soon' && 'Jobs starting soon'}
                        {item.kind === 'worker_late' && 'Workers running late'}
                        <span className="tabular-nums"> · {item.count}</span>
                      </span>
                      <span className="text-xs text-neutral-400">Open</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Cash position</CardTitle>
              <Button variant="ghost" size="sm" disabled>
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
                  {formatCurrency(cashPosition.walletBalanceNaira)}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="text-neutral-500">
                    Projected weekly spend{' '}
                    <span className="font-medium text-neutral-900 tabular-nums" data-numeric>
                      {formatCurrency(cashPosition.projectedWeeklySpendNaira)}
                    </span>
                  </span>
                </div>
              </div>
              <AreaChart
                data={spendTrend}
                xKey="day"
                yKey="amount"
                height={140}
                yFormatter={(v) => formatCurrency(v, { compact: true })}
              />
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
              <div className="flex items-center gap-6">
                <RadialProgress value={creditHealth.score} label="Score" size={140} />
                <div className="min-w-0 flex-1 space-y-2 text-sm">
                  <p className="font-medium text-neutral-900">Top factors</p>
                  <ul className="space-y-1.5 text-xs text-neutral-600">
                    {creditHealth.topFactors.slice(0, 3).map((f, idx) => (
                      <li key={`${f.label}-${idx}`} className="flex items-center justify-between">
                        <span>{f.label}</span>
                        <span
                          className={`font-medium tabular-nums ${
                            f.deltaPoints >= 0 ? 'text-success-600' : 'text-danger-600'
                          }`}
                          data-numeric
                        >
                          {f.deltaPoints >= 0 ? '+' : ''}
                          {f.deltaPoints}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/credit"
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700"
                  >
                    <IconCredit className="!h-3.5 !w-3.5" /> Eligible for{' '}
                    {formatCurrency(creditHealth.eligibility.maxAmountNaira)} @{' '}
                    {creditHealth.eligibility.aprPct}% APR
                  </Link>
                </div>
              </div>
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
            {startingSoon.length === 0 ? (
              <p className="text-sm text-neutral-600">No upcoming starts in the next window.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                {startingSoon.slice(0, 4).map((j) => (
                  <Link
                    key={j.id}
                    href={`/jobs/${j.id}`}
                    className="flex items-center justify-between rounded-lg border border-outline p-3 hover:bg-surface-container-high"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">{j.title}</p>
                      <p className="text-xs text-neutral-500">
                        {/* `neighborhood` is mistyped as Record<string, never> in the OpenAPI spec; runtime is a string. */}
                        {(typeof j.neighborhood === 'string' ? j.neighborhood : '—')} ·{' '}
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
