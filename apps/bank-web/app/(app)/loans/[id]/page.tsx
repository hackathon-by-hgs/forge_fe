import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  KeyValueList,
  PageHeader,
  RadialProgress,
  StatusDot,
  Timeline,
} from '@forge/ui';
import {
  IconAlert,
  IconCheck,
  IconExternal,
  IconShield,
  IconWarning,
} from '@forge/ui/icons';
import {
  formatAbsoluteDate,
  formatCurrency,
  formatPercent,
  formatRelativeTime,
  formatShortDate,
} from '@forge/ui/utils';
import type { LoanRepayment } from '@forge/types';
import {
  getEmployerById,
  getRepaymentSchedule,
  getWorkerById,
  MOCK_LOANS,
} from '@forge/mock-data';
import {
  RISK_LABEL,
  RISK_TONE,
  STATUS_LABEL,
  STATUS_TONE,
  getLoanAudit,
} from '../../../../lib/loanUtils';

const REPAYMENT_TONE: Record<LoanRepayment['status'], 'success' | 'danger' | 'neutral'> = {
  paid: 'success',
  missed: 'danger',
  scheduled: 'neutral',
};

const REPAYMENT_LABEL: Record<LoanRepayment['status'], string> = {
  paid: 'Paid',
  missed: 'Missed',
  scheduled: 'Scheduled',
};

export default function LoanDetailPage({ params }: { params: { id: string } }) {
  const loan = MOCK_LOANS.find((l) => l.id === params.id);
  if (!loan) notFound();

  const isWorker = loan.borrowerType === 'worker';
  const worker = isWorker ? getWorkerById(loan.borrowerId) : null;
  const business = !isWorker ? getEmployerById(loan.borrowerId) : null;
  const borrowerName = worker?.fullName ?? business?.businessName ?? loan.borrowerId;
  const borrowerScore = worker?.reliabilityScore ?? business?.creditScore ?? null;

  const schedule = getRepaymentSchedule(loan.id);
  const paid = schedule.filter((r) => r.status === 'paid');
  const missed = schedule.filter((r) => r.status === 'missed');
  const scheduled = schedule.filter((r) => r.status === 'scheduled');
  const collected = paid.reduce((s, r) => s + r.amountNaira, 0);

  const audit = getLoanAudit(loan);

  return (
    <>
      <PageHeader
        title={`Loan ${loan.id}`}
        breadcrumbs={[
          { label: 'Active Loans', href: '/loans' },
          { label: loan.id },
        ]}
        actions={
          <>
            <Button variant="ghost">Adjust schedule</Button>
            {loan.status === 'active' ? (
              <Button
                variant="ghost"
                className="text-warning-700 hover:bg-warning-50"
                leadingIcon={<IconWarning className="!h-4 !w-4" />}
              >
                Mark at risk
              </Button>
            ) : null}
            {loan.riskLevel !== 'green' ? (
              <Button
                variant="secondary"
                leadingIcon={<IconAlert className="!h-4 !w-4" />}
              >
                Refer to collections
              </Button>
            ) : null}
            <Button variant="secondary">Export</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <StatusDot tone={RISK_TONE[loan.riskLevel]} pulse={loan.riskLevel === 'red'} />
                <Badge tone={RISK_TONE[loan.riskLevel]}>{RISK_LABEL[loan.riskLevel]}</Badge>
                <Badge tone={STATUS_TONE[loan.status]} variant="soft">
                  {STATUS_LABEL[loan.status]}
                </Badge>
                <span className="font-mono text-xs text-neutral-500" data-numeric>
                  · {loan.id}
                </span>
              </div>
              <span
                className="text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {formatCurrency(loan.outstandingNaira)}
              </span>
            </CardHeader>
            <CardBody>
              <KeyValueList
                layout="grid"
                items={[
                  { label: 'Principal', value: formatCurrency(loan.principalNaira) },
                  { label: 'Outstanding', value: formatCurrency(loan.outstandingNaira) },
                  { label: 'Collected', value: formatCurrency(collected) },
                  { label: 'APR', value: formatPercent(loan.apr) },
                  { label: 'Term', value: `${loan.termMonths} months` },
                  {
                    label: 'Disbursed',
                    value: loan.disbursedAt
                      ? `${formatRelativeTime(loan.disbursedAt)} · ${formatAbsoluteDate(loan.disbursedAt)}`
                      : '—',
                  },
                  {
                    label: 'Next due',
                    value: loan.nextPaymentDueAt
                      ? formatAbsoluteDate(loan.nextPaymentDueAt)
                      : '—',
                  },
                  { label: 'Approval score', value: loan.scoreAtApproval },
                  {
                    label: 'Predicted repayment',
                    value: formatPercent(loan.predictedRepaymentRate),
                  },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Repayment schedule</CardTitle>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {paid.length} paid · {missed.length} missed · {scheduled.length} upcoming
                </p>
              </div>
              <span className="text-xs text-neutral-500">
                Total{' '}
                <span className="font-medium text-neutral-900 tabular-nums" data-numeric>
                  {formatCurrency(loan.principalNaira)}
                </span>
              </span>
            </CardHeader>
            <CardBody>
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="py-2 text-left font-medium" style={{ width: 32 }}></th>
                    <th className="py-2 text-left font-medium">#</th>
                    <th className="py-2 text-left font-medium">Due</th>
                    <th className="py-2 text-right font-medium">Amount</th>
                    <th className="py-2 text-left font-medium">Paid</th>
                    <th className="py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {schedule.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="py-2.5">
                        <StatusDot tone={REPAYMENT_TONE[r.status]} />
                      </td>
                      <td className="py-2.5 font-mono text-xs text-neutral-500" data-numeric>
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 text-neutral-700">
                        {formatShortDate(r.scheduledFor)}
                      </td>
                      <td
                        className="py-2.5 text-right font-medium tabular-nums"
                        data-numeric
                      >
                        {formatCurrency(r.amountNaira)}
                      </td>
                      <td className="py-2.5 text-xs text-neutral-500">
                        {r.paidAt ? formatShortDate(r.paidAt) : '—'}
                      </td>
                      <td className="py-2.5">
                        <Badge tone={REPAYMENT_TONE[r.status]} variant="soft">
                          {REPAYMENT_LABEL[r.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <IconShield className="!h-4 !w-4 text-neutral-500" />
                <CardTitle>Audit trail</CardTitle>
              </div>
              <Badge variant="soft">{audit.length}</Badge>
            </CardHeader>
            <CardBody>
              <Timeline
                items={audit.map((e) => ({
                  id: e.id,
                  title: (
                    <span>
                      <span className="text-neutral-500">{e.actor} ·</span>{' '}
                      {e.action}
                    </span>
                  ),
                  description: e.detail,
                  timestamp: formatRelativeTime(e.occurredAt),
                  tone: e.tone,
                  icon:
                    e.tone === 'success' ? (
                      <IconCheck className="!h-3.5 !w-3.5" />
                    ) : e.tone === 'warning' || e.tone === 'danger' ? (
                      <IconAlert className="!h-3.5 !w-3.5" />
                    ) : undefined,
                }))}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Borrower</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar name={borrowerName} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {borrowerName}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    <Badge variant="soft" className="mr-1">
                      {isWorker ? 'Worker' : 'Business'}
                    </Badge>
                    {worker?.phone ?? business?.registeredLocation.neighborhood ?? ''}
                  </p>
                </div>
                {borrowerScore != null ? (
                  <RadialProgress value={borrowerScore} size={48} strokeWidth={5} />
                ) : null}
              </div>

              {worker ? (
                <KeyValueList
                  items={[
                    { label: 'Jobs completed', value: worker.jobsCompleted },
                    { label: 'On-time rate', value: formatPercent(worker.onTimeRate) },
                    {
                      label: 'Avg weekly income',
                      value: formatCurrency(worker.averageWeeklyIncomeNaira),
                    },
                  ]}
                />
              ) : business ? (
                <KeyValueList
                  items={[
                    { label: 'Workers hired', value: business.workersHired },
                    {
                      label: 'Total labor spend',
                      value: formatCurrency(business.totalLaborSpendNaira, { compact: true }),
                    },
                    {
                      label: 'Payment timeliness',
                      value: formatPercent(business.paymentTimelinessRate),
                    },
                  ]}
                />
              ) : null}

              <Link href={`/borrowers/${loan.borrowerId}`}>
                <Button
                  variant="secondary"
                  className="w-full"
                  trailingIcon={<IconExternal className="!h-4 !w-4" />}
                >
                  Open full profile
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk</CardTitle>
              <Badge tone={RISK_TONE[loan.riskLevel]}>{RISK_LABEL[loan.riskLevel]}</Badge>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              {loan.riskLevel === 'green' ? (
                <p className="text-neutral-600">
                  Borrower is paying on schedule. Income trend stable, no flags raised.
                </p>
              ) : loan.riskLevel === 'yellow' ? (
                <p className="text-warning-700">
                  Slowing income trend over past 14 days. Consider an outreach call before the next due date.
                </p>
              ) : (
                <p className="text-danger-700">
                  Critical — no income detected for 7+ days, or repayments missed.
                  Recommend immediate collections referral.
                </p>
              )}
              <KeyValueList
                items={[
                  { label: 'Approval score', value: loan.scoreAtApproval },
                  {
                    label: 'Predicted repayment',
                    value: formatPercent(loan.predictedRepaymentRate),
                  },
                  { label: 'Missed payments', value: missed.length },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disbursement</CardTitle>
            </CardHeader>
            <CardBody>
              <KeyValueList
                items={[
                  {
                    label: 'Squad ref',
                    value: (
                      <span className="font-mono text-xs">sq_{loan.id.replace('loan_', '')}_disb</span>
                    ),
                  },
                  {
                    label: 'Disbursed',
                    value: loan.disbursedAt ? formatRelativeTime(loan.disbursedAt) : '—',
                  },
                  {
                    label: 'Amount',
                    value: formatCurrency(loan.principalNaira),
                  },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
