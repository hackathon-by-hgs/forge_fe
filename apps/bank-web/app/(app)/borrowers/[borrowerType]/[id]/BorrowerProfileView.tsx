'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AlertBanner,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  KeyValueList,
  PageHeader,
  RadialProgress,
  Skeleton,
} from '@forge/ui';
import { IconBank, IconExternal, IconLocation, IconShield } from '@forge/ui/icons';
import {
  formatAbsoluteDate,
  formatCurrency,
  formatPercent,
  formatRelativeTime,
  formatShortDate,
} from '@forge/ui/utils';
import {
  fetchBorrowerProfile,
  type BorrowerType,
  type BorrowerProfileDto,
} from '../../../../../lib/api/bankApi';
import { ApiError, toUserMessage } from '../../../../../lib/api/errors';
import {
  RISK_TONE,
  STATUS_LABEL,
  STATUS_TONE,
} from '../../../../../lib/loanUtils';

export function BorrowerProfileView({
  borrowerType,
  borrowerId,
}: {
  borrowerType: BorrowerType;
  borrowerId: string;
}) {
  const detail = useQuery({
    queryKey: ['bank', 'borrowers', borrowerType, borrowerId],
    queryFn: () => fetchBorrowerProfile(borrowerType, borrowerId),
    retry: false,
  });

  if (detail.isLoading) {
    return (
      <>
        <PageHeader
          title="Loading borrower…"
          breadcrumbs={[{ label: 'Profile' }]}
        />
        <div className="space-y-6 p-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </>
    );
  }

  if (detail.isError) {
    const err = detail.error;
    const isNotFound = err instanceof ApiError && err.status === 404;
    return (
      <>
        <PageHeader title="Borrower" breadcrumbs={[{ label: 'Profile' }]} />
        <div className="p-6">
          <AlertBanner
            tone="warning"
            title={isNotFound ? 'Borrower not visible to this bank' : 'Couldn’t load profile'}
            description={
              isNotFound
                ? "Either the borrower doesn't exist or your bank has no exposure to them."
                : toUserMessage(err)
            }
          />
        </div>
      </>
    );
  }

  const p = detail.data;
  if (!p) return null;

  return (
    <>
      <PageHeader
        title={p.displayName}
        breadcrumbs={[{ label: 'Borrower' }, { label: p.displayName }]}
      />

      <div className="space-y-6 p-6">
        <HeroCard profile={p} />
        <MetricsRow profile={p} />
        <LoanHistoryCard profile={p} />
        <IdentityCard profile={p} />
      </div>
    </>
  );
}

function HeroCard({ profile: p }: { profile: BorrowerProfileDto }) {
  const score = p.workerMetrics?.reliabilityScore ?? p.businessMetrics?.creditScore ?? 0;
  const verifiedLowRisk = p.defaultsCount === 0 && score >= 80;

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <Avatar
            name={p.displayName}
            src={p.photoUrl ?? undefined}
            size="lg"
            className="!h-20 !w-20 !text-base"
          />
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-semibold text-neutral-900">{p.displayName}</p>
              <Badge variant="soft">
                {p.type === 'worker' ? 'Worker' : 'Business'}
              </Badge>
              {verifiedLowRisk ? (
                <Badge tone="success" variant="soft">
                  Verified · low risk
                </Badge>
              ) : null}
              {p.defaultsCount > 0 ? (
                <Badge tone="danger">
                  {p.defaultsCount} default{p.defaultsCount === 1 ? '' : 's'}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-neutral-500">
              Member since {formatRelativeTime(p.memberSince)}
            </p>
            <p className="inline-flex items-center gap-1 text-xs text-neutral-500">
              <IconLocation className="!h-3 !w-3" />
              {/* Phone is on the profile page so collections can reach the borrower. */}
              {p.phoneNumber ? (
                <span className="font-mono">{p.phoneNumber}</span>
              ) : (
                <span>Lagos</span>
              )}
            </p>
          </div>
          <RadialProgress
            value={score}
            label={p.type === 'worker' ? 'Reliability' : 'Credit'}
          />
        </div>
      </CardBody>
    </Card>
  );
}

function MetricsRow({ profile: p }: { profile: BorrowerProfileDto }) {
  if (p.workerMetrics) {
    const m = p.workerMetrics;
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Jobs completed" value={String(m.jobsCompleted)} />
        <MetricCard
          label="Lifetime earned"
          value={formatCurrency(m.totalEarnedNaira, { compact: true })}
        />
        <MetricCard
          label="On-time rate"
          value={formatPercent(m.onTimeRate)}
        />
        <MetricCard
          label="Avg weekly income"
          value={formatCurrency(m.averageWeeklyIncomeNaira, { compact: true })}
          hint={`Volatility ${formatPercent(m.incomeVolatilityPct)}`}
        />
      </div>
    );
  }
  if (p.businessMetrics) {
    const m = p.businessMetrics;
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Jobs posted" value={String(m.jobsPosted)} />
        <MetricCard
          label="Lifetime spend"
          value={formatCurrency(m.totalLaborSpendNaira, { compact: true })}
        />
        <MetricCard label="Workers hired" value={String(m.workersHired)} />
        <MetricCard
          label="Payment timeliness"
          value={formatPercent(m.paymentTimelinessRate)}
        />
      </div>
    );
  }
  return null;
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs text-neutral-500">{label}</p>
        <p
          className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums"
          data-numeric
        >
          {value}
        </p>
        {hint ? <p className="mt-0.5 text-xs text-neutral-500">{hint}</p> : null}
      </CardBody>
    </Card>
  );
}

function LoanHistoryCard({ profile: p }: { profile: BorrowerProfileDto }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Loan history with this bank</CardTitle>
          <p className="mt-0.5 text-xs text-neutral-500">
            Every disbursement, every outcome.
          </p>
        </div>
        <Badge>{p.loans.length}</Badge>
      </CardHeader>
      <CardBody>
        {p.loans.length === 0 ? (
          <EmptyState
            icon={<IconBank className="!h-5 !w-5" />}
            title="No loans with this bank"
            description="A first-time disbursement would create the first row here."
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="py-2 text-left font-medium">Loan</th>
                <th className="py-2 text-right font-medium">Principal</th>
                <th className="py-2 text-right font-medium">Outstanding</th>
                <th className="py-2 text-right font-medium">APR</th>
                <th className="py-2 text-left font-medium">Disbursed</th>
                <th className="py-2 text-left font-medium">Status</th>
                <th className="py-2 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {p.loans.map((l) => (
                <tr key={l.id}>
                  <td className="py-2.5 font-mono text-xs text-neutral-700" data-numeric>
                    {l.id}
                  </td>
                  <td
                    className="py-2.5 text-right tabular-nums text-neutral-700"
                    data-numeric
                  >
                    {formatCurrency(l.principalNaira, { compact: true })}
                  </td>
                  <td
                    className="py-2.5 text-right font-medium tabular-nums"
                    data-numeric
                  >
                    {formatCurrency(l.outstandingNaira, { compact: true })}
                  </td>
                  <td
                    className="py-2.5 text-right tabular-nums text-neutral-600"
                    data-numeric
                  >
                    {formatPercent(l.apr)}
                  </td>
                  <td className="py-2.5 text-xs text-neutral-600">
                    {l.disbursedAt ? formatShortDate(l.disbursedAt) : '—'}
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Badge tone={RISK_TONE[l.riskLevel]} variant="soft">
                        {l.riskLevel}
                      </Badge>
                      <Badge tone={STATUS_TONE[l.status]} variant="soft">
                        {STATUS_LABEL[l.status]}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-2.5 text-right">
                    <Link href={`/loans/${l.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        leadingIcon={<IconExternal className="!h-3.5 !w-3.5" />}
                        aria-label="Open loan"
                      >
                        Open
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  );
}

function IdentityCard({ profile: p }: { profile: BorrowerProfileDto }) {
  const items: Array<{ label: string; value: React.ReactNode }> = [
    { label: 'Member since', value: formatAbsoluteDate(p.memberSince) },
    { label: 'Type', value: p.type === 'worker' ? 'Worker' : 'Business' },
    {
      label: 'Defaults (lifetime)',
      value: String(p.defaultsCount),
    },
  ];
  if (p.phoneNumber) {
    items.push({ label: 'Phone', value: p.phoneNumber });
  }
  if (p.workerMetrics) {
    items.push({
      label: 'Eligibility',
      value: p.workerMetrics.eligibility.replace(/_/g, ' '),
    });
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconShield className="!h-4 !w-4 text-neutral-500" />
          <CardTitle>Identity & KYC</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <KeyValueList layout="grid" items={items} />
      </CardBody>
    </Card>
  );
}
