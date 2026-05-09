'use client';

import Link from 'next/link';
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
import { getActiveJobs, MOCK_TRANSACTIONS, MOCK_EMPLOYERS } from '@forge/mock-data';
import { ActivityFeed } from '../components/ActivityFeed';
import { getRecentActivity } from '../lib/activity';
import { JOB_STATUS_TONE } from '../lib/jobUtils';

const employer = MOCK_EMPLOYERS[0]!;

export default function OverviewPage() {
  const activeJobs = getActiveJobs();
  const todaySpend = MOCK_TRANSACTIONS.slice(0, 12).reduce((s, t) => s + t.amountNaira, 0);
  const workersWorking = activeJobs.filter((j) => j.status === 'in_progress').length;
  const pendingPayments = MOCK_TRANSACTIONS.filter((t) => t.status !== 'completed').length;

  const events = getRecentActivity().slice(0, 6);
  const pins = activeJobs.slice(0, 18).map((j) => ({
    id: j.id,
    lat: j.location.lat,
    lng: j.location.lng,
    tone:
      JOB_STATUS_TONE[j.status] === 'success'
        ? ('success' as const)
        : JOB_STATUS_TONE[j.status] === 'warning'
          ? ('warning' as const)
          : JOB_STATUS_TONE[j.status] === 'info'
            ? ('info' as const)
            : ('accent' as const),
  }));

  // Synthesised cash + credit data — wires to real APIs in a later phase.
  const walletBalance = 845_000;
  const projectedWeeklySpend = 320_000;
  const spendTrend = [180_000, 210_000, 195_000, 240_000, 280_000, 305_000, 320_000].map(
    (amount, idx) => ({ day: `D${idx + 1}`, amount }),
  );

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
        {/* Top: Map + metrics column */}
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
              value={formatNumber(activeJobs.length)}
              delta={{ pct: 12.5, direction: 'up', label: 'vs. yesterday' }}
              trend={[10, 12, 11, 14, 16, 15, 18, 19, activeJobs.length]}
            />
            <MetricTile
              label="Working now"
              value={formatNumber(workersWorking)}
              delta={{ pct: 4.2, direction: 'up' }}
              trend={[5, 6, 8, 9, 7, 10, 11, workersWorking]}
            />
            <MetricTile
              label="Today's spend"
              value={formatCurrency(todaySpend, { compact: true })}
              delta={{ pct: 8.1, direction: 'up' }}
              trend={[20, 22, 25, 24, 28, 30, 32, 36]}
            />
            <MetricTile
              label="Pending payments"
              value={formatNumber(pendingPayments)}
              delta={{ pct: 2.3, direction: 'down', label: 'good' }}
              trend={[6, 5, 7, 4, 5, 3, 4, pendingPayments]}
            />
          </div>
        </div>

        {/* Middle: activity feed + attention */}
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
              <Badge tone="warning">3</Badge>
            </CardHeader>
            <CardBody>
              <ul className="-mx-1 space-y-1 text-sm">
                <li>
                  <Link
                    href="/jobs/active"
                    className="flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-neutral-50"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-warning-50 text-warning-600">
                      <IconUser className="!h-3.5 !w-3.5" />
                    </span>
                    <span className="flex-1">7 applications waiting</span>
                    <span className="text-xs text-neutral-400">Review</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/jobs/active"
                    className="flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-neutral-50"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-info-50 text-info-600">
                      <IconClock className="!h-3.5 !w-3.5" />
                    </span>
                    <span className="flex-1">2 jobs starting in &lt; 1 hour</span>
                    <span className="text-xs text-neutral-400">View</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/workers/active"
                    className="flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-neutral-50"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-danger-50 text-danger-600">
                      <IconAlert className="!h-3.5 !w-3.5" />
                    </span>
                    <span className="flex-1">1 worker running late</span>
                    <span className="text-xs text-neutral-400">Contact</span>
                  </Link>
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>

        {/* Bottom: Cash position + Credit health */}
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
                  {formatCurrency(walletBalance)}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="text-neutral-500">
                    Projected weekly spend{' '}
                    <span className="font-medium text-neutral-900 tabular-nums" data-numeric>
                      {formatCurrency(projectedWeeklySpend)}
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
                <RadialProgress value={employer.creditScore} label="Score" size={140} />
                <div className="min-w-0 flex-1 space-y-2 text-sm">
                  <p className="font-medium text-neutral-900">Top factors</p>
                  <ul className="space-y-1.5 text-xs text-neutral-600">
                    <li className="flex items-center justify-between">
                      <span>Payment timeliness</span>
                      <span className="font-medium text-success-600 tabular-nums" data-numeric>
                        +12
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Worker retention</span>
                      <span className="font-medium text-success-600 tabular-nums" data-numeric>
                        +8
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Job cancellation rate</span>
                      <span className="font-medium text-danger-600 tabular-nums" data-numeric>
                        −3
                      </span>
                    </li>
                  </ul>
                  <Link href="/credit" className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700">
                    <IconCredit className="!h-3.5 !w-3.5" /> Eligible for ₦2.0M @ 14% APR
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Strip: upcoming jobs preview */}
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {activeJobs.slice(0, 4).map((j) => (
                <Link
                  key={j.id}
                  href={`/jobs/${j.id}`}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 hover:border-neutral-300"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">{j.title}</p>
                    <p className="text-xs text-neutral-500">
                      {j.location.neighborhood} · {formatShortDate(j.scheduledStartAt)}
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
          </CardBody>
        </Card>
      </div>
    </>
  );
}
