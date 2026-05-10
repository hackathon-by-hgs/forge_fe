'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  MetricTile,
  PageHeader,
  Skeleton,
  StatusDot,
} from '@forge/ui';
import { IconAlert, IconAttribution, IconBorrowers } from '@forge/ui/icons';
import { formatCurrency, formatNumber, formatPercent } from '@forge/ui/utils';
import { getRiskRadarMock } from '../../lib/api/bank';
import type {
  BankRiskRadarCriticalItemDto,
  BankRiskRadarDto,
  BankRiskRadarOpportunityDto,
  BankRiskRadarWatchItemDto,
} from '../../lib/api/bankTypes';
import { NetworkError, toUserMessage } from '../../lib/api/errors';

// TODO(phase-4): Swap `getRiskRadarMock` for `fetchRiskRadar` when
// `GET /v1/bank/risk-radar` ships (BE team ETA: Phase 3 + 24h).
export default function RiskRadarPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['bank', 'risk-radar'],
    queryFn: getRiskRadarMock,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  if (isPending) {
    return <RiskRadarSkeleton />;
  }

  if (isError) {
    return (
      <RiskRadarErrorState
        error={error}
        onRetry={() => void refetch()}
        retrying={isFetching}
      />
    );
  }

  return <RiskRadarDashboard data={data} />;
}

function RiskRadarSkeleton() {
  return (
    <>
      <PageHeader
        title="Risk Radar"
        description="What needs attention, what's healthy, what's growing — at a glance."
        actions={
          <Skeleton className="h-10 w-44 rounded-lg" />
        }
      />
      <div className="space-y-6 p-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    </>
  );
}

function RiskRadarErrorState({
  error,
  onRetry,
  retrying,
}: {
  error: unknown;
  onRetry: () => void;
  retrying: boolean;
}) {
  const isOffline = error instanceof NetworkError;
  return (
    <>
      <PageHeader
        title="Risk Radar"
        description="What needs attention, what's healthy, what's growing — at a glance."
      />
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
        <EmptyState
          icon={<IconAlert className="!h-8 !w-8 text-danger-600" />}
          title={isOffline ? 'Cannot reach the server' : 'Risk Radar failed to load'}
          description={toUserMessage(error)}
        />
        <Button variant="secondary" loading={retrying} onClick={onRetry}>
          Retry
        </Button>
      </div>
    </>
  );
}

function RiskRadarDashboard({ data }: { data: BankRiskRadarDto }) {
  const metrics = data.metrics ?? {};
  const critical = data.criticalAlerts ?? [];
  const watch = data.watchList ?? [];
  const opportunity = data.opportunity ?? [];

  const activeCount = metrics.activeLoansCount ?? 0;
  const outstanding = metrics.activeLoansOutstandingNaira ?? 0;
  const sparkDefault = [2, 3, 4, 5, 6, 7, 8];

  return (
    <>
      <PageHeader
        title="Risk Radar"
        description="What needs attention, what's healthy, what's growing — at a glance."
        actions={
          <Button variant="secondary" leadingIcon={<IconAttribution className="!h-4 !w-4" />} disabled>
            Open Performance
          </Button>
        }
      />

      <div className="space-y-6 p-6">
        {critical.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <IconAlert className="!h-4 !w-4 text-danger-600" />
                <CardTitle>Critical alerts</CardTitle>
                <Badge tone="danger">{critical.length}</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="-mx-1 flex gap-3 overflow-x-auto pb-1">
                {critical.slice(0, 6).map((loan) => (
                  <CriticalLoanCard key={loan.loanId} loan={loan} />
                ))}
              </div>
            </CardBody>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <MetricTile
            label="Active loans"
            value={formatNumber(activeCount)}
            hint={
              outstanding > 0
                ? `${formatCurrency(outstanding, { compact: true })} outstanding`
                : undefined
            }
            trend={metrics.activeLoansTrend ?? sparkDefault}
          />
          <MetricTile
            label="Total disbursed"
            value={formatCurrency(metrics.totalDisbursedNaira ?? 0, { compact: true })}
            trend={metrics.disbursedTrend ?? sparkDefault}
          />
          <MetricTile
            label="Repayment rate"
            value={formatPercent(metrics.repaymentRate ?? 0)}
            trend={metrics.repaymentTrend ?? sparkDefault}
          />
          <MetricTile
            label="Default rate"
            value={formatPercent(metrics.defaultRate ?? 0)}
            trend={metrics.defaultTrend ?? sparkDefault}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Watch list</CardTitle>
              <Badge tone="warning">{watch.length}</Badge>
            </CardHeader>
            <CardBody>
              {watch.length === 0 ? (
                <EmptyState
                  icon={<IconBorrowers className="!h-5 !w-5" />}
                  title="Nothing on the watch list"
                  description="No borrowers showing yellow-flag patterns right now."
                />
              ) : (
                <ul className="divide-y divide-outline-variant text-sm">
                  {watch.slice(0, 8).map((item) => (
                    <WatchRow key={item.loanId} item={item} />
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live events</CardTitle>
              <Badge tone="success" variant="soft">
                <StatusDot tone="success" pulse /> Soon
              </Badge>
            </CardHeader>
            <CardBody>
              <EmptyState
                title="SSE feed — Phase 4"
                description="FRONTEND_INTEGRATION.md §7 — `/v1/stream` consumers wire here once Backend Phase 4 lands. Until then, use manual refresh or polling."
              />
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Opportunity</CardTitle>
              <p className="mt-0.5 text-xs text-ink-muted">
                {opportunity.length === 0
                  ? 'Eligible borrowers surfaced by the platform credit model appear here.'
                  : `${opportunity.length} prospects matched your criteria.`}
              </p>
            </div>
            <Button variant="secondary" size="sm" disabled>
              View all
            </Button>
          </CardHeader>
          <CardBody>
            {opportunity.length === 0 ? (
              <EmptyState
                title="No opportunities yet"
                description="When the Risk Radar payload includes `opportunity`, pre-approved borrowers render in this grid."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {opportunity.slice(0, 6).map((row) => (
                  <OpportunityCard key={row.id} row={row} />
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function CriticalLoanCard({ loan }: { loan: BankRiskRadarCriticalItemDto }) {
  const loanHref = `/loans/${encodeURIComponent(loan.loanId)}`;
  return (
    <div className="flex w-72 shrink-0 flex-col gap-2 rounded-lg border border-danger-500/20 bg-danger-50/40 p-3 dark:bg-danger-950/20">
      <div className="flex items-center gap-2">
        <Avatar name={loan.borrowerName ?? loan.loanId} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{loan.borrowerName ?? 'Borrower'}</p>
          <p className="truncate font-mono text-[10px] text-ink-muted" data-numeric>
            {loan.loanId}
          </p>
        </div>
        <Badge tone="danger">{loan.riskLevel ?? 'RED'}</Badge>
      </div>
      <div className="flex items-baseline justify-between text-xs text-ink-muted">
        <span>Outstanding</span>
        <span className="font-medium text-ink" data-numeric>
          {formatCurrency(loan.outstandingNaira ?? 0)}
        </span>
      </div>
      {loan.headline ? <p className="text-xs text-danger-700">{loan.headline}</p> : null}
      <Link
        href={loanHref}
        className="inline-flex h-8 items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
      >
        Investigate
      </Link>
    </div>
  );
}

function WatchRow({ item }: { item: BankRiskRadarWatchItemDto }) {
  const loanHref = `/loans/${encodeURIComponent(item.loanId)}`;
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <StatusDot tone="warning" />
      <Avatar name={item.borrowerName ?? item.loanId} size="sm" />
      <div className="min-w-0 flex-1">
        <Link href={loanHref} className="truncate text-sm font-medium text-ink hover:text-accent-600">
          {item.borrowerName ?? item.loanId}
        </Link>
        <p className="text-xs text-ink-muted">{item.detail ?? 'Requires monitoring'}</p>
      </div>
      <span className="text-sm font-medium text-ink tabular-nums" data-numeric>
        {formatCurrency(item.outstandingNaira ?? 0)}
      </span>
    </li>
  );
}

function OpportunityCard({ row }: { row: BankRiskRadarOpportunityDto }) {
  const href = `/borrowers/${encodeURIComponent(row.id)}`;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-outline p-3">
      <Avatar name={row.fullName ?? row.id} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{row.fullName ?? row.id}</p>
        <p className="truncate text-xs text-ink-muted">
          Score {row.reliabilityScore ?? '—'} · {row.jobsCompleted ?? 0} jobs
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
      >
        Profile
      </Link>
    </div>
  );
}
