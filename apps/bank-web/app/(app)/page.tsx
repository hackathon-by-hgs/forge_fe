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
import { fetchRiskRadar } from '../../lib/api/bankApi';
import type {
  LoanDto,
  OpportunityBorrowerDto,
  RiskRadarResponseDto,
} from '../../lib/api/bankApi';
import { ApiError, NetworkError, toUserMessage } from '../../lib/api/errors';

export default function RiskRadarPage() {
  const { data, isPending, isError, isSuccess, error, refetch, isFetching } = useQuery({
    queryKey: ['bank', 'risk-radar'],
    queryFn: fetchRiskRadar,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const isRefreshing = Boolean(data) && isFetching && !isPending;

  if (isPending) return <RiskRadarSkeleton />;
  if (isError) {
    return (
      <RiskRadarErrorState
        error={error}
        onRetry={() => void refetch()}
        retrying={isFetching}
      />
    );
  }

  if (isSuccess) {
    return (
      <RiskRadarDashboard data={data} isRefreshing={isRefreshing} />
    );
  }

  return <RiskRadarSkeleton />;
}

function RiskRadarSkeleton() {
  return (
    <>
      <PageHeader
        title="Risk Radar"
        description="Loading the latest portfolio snapshot from the server…"
        actions={<Skeleton className="h-10 w-44 rounded-lg" />}
      />
      <p className="sr-only" role="status">
        Loading risk radar data.
      </p>
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
  const isNoBankScope =
    error instanceof ApiError && error.status === 403 && error.code === 'NO_BANK_SCOPE';

  if (isNoBankScope) {
    return (
      <>
        <PageHeader title="Risk Radar" />
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
          <EmptyState
            icon={<IconAlert className="!h-8 !w-8 text-warning-600" />}
            title="This account isn't bound to a bank yet"
            description="Contact your administrator or Forge support to get provisioned."
          />
          <a
            href="mailto:support@forge.app?subject=No%20bank%20scope"
            className="text-sm font-medium text-accent-600 hover:underline"
          >
            Contact support
          </a>
        </div>
      </>
    );
  }

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
            description={
              isOffline
                ? 'Check your internet connection, then try again. If the problem continues, the Forge API may be unreachable.'
                : toUserMessage(error)
            }
        />
        <Button variant="secondary" loading={retrying} onClick={onRetry}>
          Retry
        </Button>
      </div>
    </>
  );
}

function RiskRadarDashboard({
  data,
  isRefreshing,
}: {
  data: RiskRadarResponseDto;
  isRefreshing: boolean;
}) {
  const { portfolio, critical, watchlist, opportunity } = data;

  return (
    <>
      <PageHeader
        title="Risk Radar"
        description="What needs attention, what's healthy, what's growing — at a glance."
        actions={
          <Button
            variant="secondary"
            leadingIcon={<IconAttribution className="!h-4 !w-4" />}
            disabled
          >
            Open Performance
          </Button>
        }
      />

      {isRefreshing ? (
        <p
          className="mx-6 -mt-2 text-sm text-ink-muted"
          role="status"
          aria-live="polite"
        >
          Refreshing risk radar data from the server…
        </p>
      ) : null}

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
                  <CriticalLoanCard key={loan.id} loan={loan} />
                ))}
              </div>
            </CardBody>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <MetricTile
            label="Active loans"
            value={formatNumber(portfolio.activeCount)}
            hint={
              portfolio.outstandingTotalNaira > 0
                ? `${formatCurrency(portfolio.outstandingTotalNaira, { compact: true })} outstanding`
                : undefined
            }
          />
          <MetricTile
            label="Total disbursed"
            value={formatCurrency(portfolio.disbursedTotalNaira, { compact: true })}
          />
          <MetricTile
            label="Repayment rate"
            value={formatPercent(portfolio.repaymentRate)}
          />
          <MetricTile
            label="Default rate"
            value={formatPercent(portfolio.defaultRate)}
            hint={`${portfolio.atRiskCount} at risk`}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Watch list</CardTitle>
              <Badge tone="warning">{watchlist.length}</Badge>
            </CardHeader>
            <CardBody>
              {watchlist.length === 0 ? (
                <EmptyState
                  icon={<IconBorrowers className="!h-5 !w-5" />}
                  title="Nothing on the watch list"
                  description="No yellow-flag loans right now."
                />
              ) : (
                <ul className="divide-y divide-outline-variant text-sm">
                  {watchlist.slice(0, 8).map((loan) => (
                    <WatchRow key={loan.id} loan={loan} />
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lending opportunities</CardTitle>
              <Badge variant="soft">{opportunity.length}</Badge>
            </CardHeader>
            <CardBody>
              {opportunity.length === 0 ? (
                <EmptyState
                  title="No opportunities surfaced"
                  description="Pre-approved workers without an active loan will appear here as the platform identifies them."
                />
              ) : (
                <ul className="space-y-2">
                  {opportunity.slice(0, 5).map((row) => (
                    <OpportunityRow key={row.id} row={row} />
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function CriticalLoanCard({ loan }: { loan: LoanDto }) {
  return (
    <Link
      href={`/loans/${encodeURIComponent(loan.id)}`}
      className="flex w-72 shrink-0 flex-col gap-2 rounded-lg border border-danger-500/20 bg-danger-50/40 p-3 hover:bg-danger-50 dark:bg-danger-950/20"
    >
      <div className="flex items-center gap-2">
        <Avatar
          name={loan.borrower.displayName}
          src={loan.borrower.photoUrl ?? undefined}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">
            {loan.borrower.displayName}
          </p>
          <p className="truncate font-mono text-[10px] text-ink-muted" data-numeric>
            {loan.id}
          </p>
        </div>
        <Badge
          tone={
            loan.riskLevel === 'red'
              ? 'danger'
              : loan.riskLevel === 'yellow'
                ? 'warning'
                : 'neutral'
          }
        >
          {loan.riskLevel.toUpperCase()}
        </Badge>
      </div>
      <div className="flex items-baseline justify-between text-xs text-ink-muted">
        <span>Outstanding</span>
        <span className="font-medium text-ink" data-numeric>
          {formatCurrency(loan.outstandingNaira)}
        </span>
      </div>
      {loan.nextPaymentDueAt ? (
        <p className="text-xs text-danger-700">
          Next due {new Date(loan.nextPaymentDueAt).toLocaleDateString()}
        </p>
      ) : null}
    </Link>
  );
}

function WatchRow({ loan }: { loan: LoanDto }) {
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <StatusDot tone="warning" />
      <Avatar
        name={loan.borrower.displayName}
        src={loan.borrower.photoUrl ?? undefined}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <Link
          href={`/loans/${encodeURIComponent(loan.id)}`}
          className="truncate text-sm font-medium text-ink hover:text-accent-600"
        >
          {loan.borrower.displayName}
        </Link>
        <p className="text-xs text-ink-muted">
          Score {loan.borrower.score} ·{' '}
          {loan.nextPaymentDueAt
            ? `next due ${new Date(loan.nextPaymentDueAt).toLocaleDateString()}`
            : 'no upcoming payment'}
        </p>
      </div>
      <span className="text-sm font-medium text-ink tabular-nums" data-numeric>
        {formatCurrency(loan.outstandingNaira)}
      </span>
    </li>
  );
}

function OpportunityRow({ row }: { row: OpportunityBorrowerDto }) {
  return (
    <li>
      <Link
        href={`/borrowers/worker/${encodeURIComponent(row.id)}`}
        className="flex items-center gap-3 rounded-lg border border-outline p-3 hover:bg-surface-container-high"
      >
        <Avatar name={row.displayName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{row.displayName}</p>
          <p className="truncate text-xs text-ink-muted">
            Score {row.score} ·{' '}
            <Badge
              tone={row.eligibility === 'pre_approved' ? 'success' : 'info'}
              variant="soft"
            >
              {row.eligibility.replace(/_/g, ' ')}
            </Badge>
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-ink tabular-nums" data-numeric>
          up to {formatCurrency(row.maxAmountNaira, { compact: true })}
        </span>
      </Link>
    </li>
  );
}
