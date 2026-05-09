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
  StatusDot,
} from '@forge/ui';
import { IconAlert, IconAttribution, IconBorrowers } from '@forge/ui/icons';
import { formatCurrency, formatNumber, formatPercent } from '@forge/ui/utils';
import { MOCK_BANKS, MOCK_LOANS, MOCK_WORKERS } from '@forge/mock-data';

export default function RiskRadarPage() {
  const bank = MOCK_BANKS[0];
  const atRiskLoans = MOCK_LOANS.filter((l) => l.riskLevel !== 'green');
  const redLoans = MOCK_LOANS.filter((l) => l.riskLevel === 'red');
  const yellowLoans = MOCK_LOANS.filter((l) => l.riskLevel === 'yellow');
  const totalActive = MOCK_LOANS.filter((l) => l.status === 'active' || l.status === 'at_risk');
  const totalActiveValue = totalActive.reduce((s, l) => s + l.outstandingNaira, 0);

  return (
    <>
      <PageHeader
        title="Risk Radar"
        description="What needs attention, what's healthy, what's growing — at a glance."
        actions={
          <Button variant="secondary" leadingIcon={<IconAttribution className="!h-4 !w-4" />}>
            Open Performance
          </Button>
        }
      />

      <div className="space-y-6 p-6">
        {redLoans.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <IconAlert className="!h-4 !w-4 text-danger-600" />
                <CardTitle>Critical alerts</CardTitle>
                <Badge tone="danger">{redLoans.length}</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="-mx-1 flex gap-3 overflow-x-auto pb-1">
                {redLoans.slice(0, 6).map((loan) => {
                  const w = MOCK_WORKERS.find((wk) => wk.id === loan.borrowerId);
                  return (
                    <div
                      key={loan.id}
                      className="flex w-72 shrink-0 flex-col gap-2 rounded-lg border border-danger-500/20 bg-danger-50/40 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={w?.fullName ?? loan.borrowerId} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-neutral-900">
                            {w?.fullName ?? 'Borrower'}
                          </p>
                          <p
                            className="truncate font-mono text-[10px] text-neutral-500"
                            data-numeric
                          >
                            {loan.id}
                          </p>
                        </div>
                        <Badge tone="danger">RED</Badge>
                      </div>
                      <div className="flex items-baseline justify-between text-xs text-neutral-600">
                        <span>Outstanding</span>
                        <span className="font-medium text-neutral-900" data-numeric>
                          {formatCurrency(loan.outstandingNaira)}
                        </span>
                      </div>
                      <p className="text-xs text-danger-700">
                        No income detected for 7+ days. Review payment plan.
                      </p>
                      <Button variant="secondary" size="sm">
                        Investigate
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <MetricTile
            label="Active loans"
            value={formatNumber(totalActive.length)}
            hint={formatCurrency(totalActiveValue, { compact: true }) + ' outstanding'}
            trend={[18, 19, 22, 21, 24, 26, totalActive.length]}
          />
          <MetricTile
            label="Total disbursed"
            value={formatCurrency(bank?.totalDisbursedNaira ?? 0, { compact: true })}
            delta={{ pct: 14.3, direction: 'up', label: 'this month' }}
            trend={[11, 13, 14, 15, 17, 18, 18.5]}
          />
          <MetricTile
            label="Repayment rate"
            value={formatPercent(bank?.repaymentRate ?? 0)}
            delta={{ pct: 0.8, direction: 'up' }}
            trend={[0.91, 0.92, 0.92, 0.93, 0.93, 0.94, 0.94]}
          />
          <MetricTile
            label="Default rate"
            value={formatPercent(bank?.defaultRate ?? 0)}
            delta={{ pct: 0.4, direction: 'down', label: 'good' }}
            trend={[0.06, 0.06, 0.05, 0.05, 0.04, 0.04, 0.04]}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Watch list</CardTitle>
              <Badge tone="warning">{yellowLoans.length}</Badge>
            </CardHeader>
            <CardBody>
              {yellowLoans.length === 0 ? (
                <EmptyState
                  icon={<IconBorrowers className="!h-5 !w-5" />}
                  title="Nothing on the watch list"
                  description="No borrowers showing yellow-flag patterns right now."
                />
              ) : (
                <ul className="divide-y divide-neutral-100 text-sm">
                  {yellowLoans.slice(0, 6).map((loan) => {
                    const w = MOCK_WORKERS.find((wk) => wk.id === loan.borrowerId);
                    return (
                      <li
                        key={loan.id}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <StatusDot tone="warning" />
                        <Avatar name={w?.fullName ?? loan.borrowerId} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-neutral-900">
                            {w?.fullName ?? loan.borrowerId}
                          </p>
                          <p className="text-xs text-neutral-500">
                            Slowing income trend over past 14 days
                          </p>
                        </div>
                        <span
                          className="text-sm font-medium text-neutral-900 tabular-nums"
                          data-numeric
                        >
                          {formatCurrency(loan.outstandingNaira)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live events</CardTitle>
              <Badge tone="success" variant="soft">
                <StatusDot tone="success" pulse /> Live
              </Badge>
            </CardHeader>
            <CardBody>
              <EmptyState
                title="Events feed wires in next phase"
                description="Stripe-style log of disbursements, repayments, and borrower activity."
              />
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Opportunity</CardTitle>
              <p className="mt-0.5 text-xs text-neutral-500">
                {atRiskLoans.length === 0
                  ? 'Newly eligible borrowers based on the platform credit model.'
                  : `${MOCK_WORKERS.filter((w) => w.eligibility === 'pre_approved').length} pre-approved workers ready for outreach.`}
              </p>
            </div>
            <Button variant="secondary" size="sm">
              View all
            </Button>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {MOCK_WORKERS.filter((w) => w.eligibility === 'pre_approved')
                .slice(0, 3)
                .map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3"
                  >
                    <Avatar name={w.fullName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {w.fullName}
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        Score {w.reliabilityScore} · {w.jobsCompleted} jobs
                      </p>
                    </div>
                    <Button size="sm" variant="secondary">
                      Pre-approve
                    </Button>
                  </div>
                ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
