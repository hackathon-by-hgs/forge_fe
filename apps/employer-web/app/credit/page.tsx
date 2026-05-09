'use client';

import {
  AlertBanner,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  KeyValueList,
  LineChart,
  PageHeader,
  RadialProgress,
} from '@forge/ui';
import { IconCheck, IconCredit } from '@forge/ui/icons';
import { formatCurrency } from '@forge/ui/utils';
import { MOCK_EMPLOYERS, MOCK_LOANS } from '@forge/mock-data';

const employer = MOCK_EMPLOYERS[0]!;

export default function CreditPage() {
  const businessLoans = MOCK_LOANS.filter(
    (l) => l.borrowerType === 'business' && l.borrowerId === employer.id,
  );
  const active = businessLoans.find((l) => l.status === 'active' || l.status === 'at_risk');
  const repaymentProgress = active
    ? 1 - active.outstandingNaira / active.principalNaira
    : 0;

  const trend = Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    score: Math.max(50, employer.creditScore - 10 + i),
  }));

  return (
    <>
      <PageHeader
        title="Credit & Loans"
        description="Borrow against your verified hiring history."
      />

      <div className="space-y-6 p-6">
        <Card>
          <CardBody className="grid grid-cols-1 items-center gap-6 md:grid-cols-3">
            <div className="flex items-center gap-6">
              <RadialProgress value={employer.creditScore} label="Credit score" />
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-400">
                  Business credit score
                </p>
                <p
                  className="mt-1 text-3xl font-semibold text-neutral-900 tabular-nums"
                  data-numeric
                >
                  {employer.creditScore}
                </p>
                <p className="mt-1 text-xs text-success-600">
                  +6 this month
                </p>
              </div>
            </div>
            <div className="md:col-span-2">
              <LineChart
                data={trend}
                xKey="week"
                series={[{ key: 'score', label: 'Score' }]}
                height={140}
                yFormatter={(v) => `${v}`}
              />
            </div>
          </CardBody>
        </Card>

        <AlertBanner
          tone="success"
          icon={<IconCheck className="!h-4 !w-4" />}
          title="You're eligible for a business loan up to ₦2,000,000"
          description="14% APR · 6 month term · disbursed within 24 hours of approval"
          action={<Button>Apply now</Button>}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Active loan</CardTitle>
              {active ? (
                <Badge tone={active.riskLevel === 'green' ? 'success' : 'warning'}>
                  On track
                </Badge>
              ) : null}
            </CardHeader>
            <CardBody>
              {active ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500">Principal</p>
                      <p
                        className="mt-1 text-xl font-semibold text-neutral-900 tabular-nums"
                        data-numeric
                      >
                        {formatCurrency(active.principalNaira)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Outstanding</p>
                      <p
                        className="mt-1 text-xl font-semibold text-neutral-900 tabular-nums"
                        data-numeric
                      >
                        {formatCurrency(active.outstandingNaira)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">APR</p>
                      <p
                        className="mt-1 text-xl font-semibold text-neutral-900 tabular-nums"
                        data-numeric
                      >
                        {(active.apr * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>Repayment progress</span>
                      <span className="tabular-nums" data-numeric>
                        {(repaymentProgress * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-accent-500"
                        style={{ width: `${repaymentProgress * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<IconCredit className="!h-5 !w-5" />}
                  title="No active loan"
                  description="Apply for a business loan against your verified hiring history."
                  action={<Button>Apply now</Button>}
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What moves your score</CardTitle>
            </CardHeader>
            <CardBody>
              <KeyValueList
                items={[
                  { label: 'Payment timeliness', value: '+12' },
                  { label: 'Worker retention', value: '+8' },
                  { label: 'Job completion rate', value: '+5' },
                  { label: 'Cancellation rate', value: '−3' },
                ]}
              />
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Past loans</CardTitle>
          </CardHeader>
          <CardBody>
            {businessLoans.length === 0 ? (
              <EmptyState
                title="No loan history yet"
                description="Repay your first loan and the history shows here."
              />
            ) : (
              <ul className="divide-y divide-neutral-100">
                {businessLoans.slice(0, 5).map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {formatCurrency(l.principalNaira)}{' '}
                        <span className="text-xs font-normal text-neutral-500">
                          @ {(l.apr * 100).toFixed(0)}%
                        </span>
                      </p>
                      <p className="text-xs text-neutral-500">
                        {l.termMonths} months · {l.status}
                      </p>
                    </div>
                    <Badge
                      tone={
                        l.status === 'repaid'
                          ? 'success'
                          : l.status === 'defaulted'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {l.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
