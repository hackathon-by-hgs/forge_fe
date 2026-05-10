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
  Sparkline,
  Textarea,
  Timeline,
} from '@forge/ui';
import {
  IconCheck,
  IconClose,
  IconExternal,
  IconShield,
  IconUser,
} from '@forge/ui/icons';
import {
  formatAbsoluteDate,
  formatCurrency,
  formatPercent,
  formatRelativeTime,
} from '@forge/ui/utils';
import {
  getEmployerById,
  getScoreFactors,
  getWorkerById,
  MOCK_LOAN_APPLICATIONS,
  MOCK_LOANS,
} from '@forge/mock-data';
import {
  DECISION_LABEL,
  DECISION_TONE,
  getApplicationAudit,
} from '../../../lib/loanUtils';

export default function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const app = MOCK_LOAN_APPLICATIONS.find((a) => a.id === params.id);
  if (!app) notFound();

  const isWorker = app.borrowerType === 'worker';
  const worker = isWorker ? getWorkerById(app.borrowerId) : null;
  const business = !isWorker ? getEmployerById(app.borrowerId) : null;

  const borrowerName = worker?.fullName ?? business?.businessName ?? app.borrowerId;
  const score = worker?.reliabilityScore ?? business?.creditScore ?? null;
  const factors = worker ? getScoreFactors(worker.id) : [];
  const priorLoans = MOCK_LOANS.filter((l) => l.borrowerId === app.borrowerId);
  const audit = getApplicationAudit(app);

  return (
    <>
      <PageHeader
        title={borrowerName}
        breadcrumbs={[
          { label: 'Applications', href: '/applications' },
          { label: app.id },
        ]}
        actions={
          <>
            <Button variant="ghost">Refer</Button>
            <Button
              variant="ghost"
              className="text-danger-600 hover:bg-danger-50"
              leadingIcon={<IconClose className="!h-4 !w-4" />}
            >
              Reject
            </Button>
            <Button leadingIcon={<IconCheck className="!h-4 !w-4" />}>Approve</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge tone={DECISION_TONE[app.recommendedDecision]}>
                  Model: {DECISION_LABEL[app.recommendedDecision]}
                </Badge>
                <span className="font-mono text-xs text-neutral-500" data-numeric>
                  · {app.id}
                </span>
              </div>
              <span
                className="text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {formatCurrency(app.amountRequestedNaira)}
              </span>
            </CardHeader>
            <CardBody className="space-y-5">
              <div className="flex items-start gap-4">
                <Avatar name={borrowerName} size="lg" />
                <div className="flex-1">
                  <p className="text-lg font-semibold text-neutral-900">{borrowerName}</p>
                  <p className="mt-0.5 inline-flex items-center gap-2 text-xs text-neutral-500">
                    <Badge variant="soft">{isWorker ? 'Worker' : 'Business'}</Badge>
                    {worker
                      ? `${worker.primarySkill} · ${worker.homeLocation.neighborhood}`
                      : business
                        ? `${business.type} · ${business.registeredLocation.neighborhood}`
                        : null}
                  </p>
                  <p className="mt-2 text-sm text-neutral-700">
                    {app.recommendationReason}
                  </p>
                </div>
                {score != null ? (
                  <RadialProgress
                    value={score}
                    label={isWorker ? 'Reliability' : 'Credit'}
                  />
                ) : null}
              </div>

              <KeyValueList
                layout="grid"
                items={[
                  {
                    label: 'Amount requested',
                    value: formatCurrency(app.amountRequestedNaira),
                  },
                  {
                    label: 'Applied',
                    value: `${formatRelativeTime(app.appliedAt)} · ${formatAbsoluteDate(app.appliedAt)}`,
                  },
                  {
                    label: 'Model confidence',
                    value: `${app.recommendationConfidencePct}%`,
                  },
                  {
                    label: 'Borrower score',
                    value: score != null ? String(score) : '—',
                  },
                ]}
              />
            </CardBody>
          </Card>

          {factors.length > 0 ? (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Why this recommendation</CardTitle>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Factor breakdown driving the model&apos;s score and decision.
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                <table className="w-full text-sm">
                  <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="py-2 text-left font-medium">Factor</th>
                      <th className="py-2 text-right font-medium">Value</th>
                      <th className="py-2 text-right font-medium">Weight</th>
                      <th className="py-2 text-left font-medium">Trend</th>
                      <th className="py-2 text-left font-medium">Why it matters</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {factors.map((f) => (
                      <tr key={f.key}>
                        <td className="py-3 font-medium text-neutral-900">{f.label}</td>
                        <td className="py-3 text-right tabular-nums" data-numeric>
                          {formatPercent(f.value)}
                        </td>
                        <td className="py-3 text-right tabular-nums text-neutral-600" data-numeric>
                          {formatPercent(f.weight)}
                        </td>
                        <td className="py-3">
                          <Sparkline data={f.trend.map((v) => v * 100)} className="h-6 w-24" />
                        </td>
                        <td className="py-3 text-xs text-neutral-600">{f.rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Borrower history</CardTitle>
              <Badge>{priorLoans.length} prior loans</Badge>
            </CardHeader>
            <CardBody>
              {priorLoans.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-500">
                  No prior loans on file. This would be a first-time disbursement.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100 text-sm">
                  {priorLoans.slice(0, 6).map((l) => (
                    <li
                      key={l.id}
                      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <span className="font-mono text-xs text-neutral-500" data-numeric>
                        {l.id}
                      </span>
                      <span
                        className="flex-1 tabular-nums text-neutral-700"
                        data-numeric
                      >
                        {formatCurrency(l.principalNaira, { compact: true })}
                      </span>
                      <Badge tone={l.riskLevel === 'green' ? 'success' : l.riskLevel === 'yellow' ? 'warning' : 'danger'} variant="soft">
                        {l.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <IconShield className="!h-4 !w-4 text-neutral-500" />
                <CardTitle>Audit trail</CardTitle>
              </div>
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
                }))}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Decision</CardTitle>
              <Badge tone={DECISION_TONE[app.recommendedDecision]} variant="soft">
                Model: {DECISION_LABEL[app.recommendedDecision]} · {app.recommendationConfidencePct}%
              </Badge>
            </CardHeader>
            <CardBody className="space-y-3">
              <Textarea
                placeholder="Add a decision note (required for Approve / Reject)…"
                rows={4}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button leadingIcon={<IconCheck className="!h-4 !w-4" />}>
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  className="text-danger-600 hover:bg-danger-50"
                  leadingIcon={<IconClose className="!h-4 !w-4" />}
                >
                  Reject
                </Button>
              </div>
              <Button variant="ghost" className="w-full">
                Approve with conditions
              </Button>
              <p className="pt-2 text-[11px] text-neutral-500">
                Every decision is logged to the audit trail and posted to the borrower instantly.
              </p>
            </CardBody>
          </Card>

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
                    {worker?.phone ?? business?.registeredLocation.neighborhood ?? ''}
                  </p>
                </div>
              </div>

              {worker ? (
                <KeyValueList
                  items={[
                    { label: 'Jobs completed', value: worker.jobsCompleted },
                    {
                      label: 'On-time rate',
                      value: formatPercent(worker.onTimeRate),
                    },
                    {
                      label: 'Avg weekly income',
                      value: formatCurrency(worker.averageWeeklyIncomeNaira),
                    },
                    {
                      label: 'Income volatility',
                      value: formatPercent(worker.incomeVolatilityPct),
                    },
                    { label: 'Eligibility', value: worker.eligibility.replace(/_/g, ' ') },
                  ]}
                />
              ) : business ? (
                <KeyValueList
                  items={[
                    { label: 'Type', value: business.type },
                    { label: 'Workers hired', value: business.workersHired },
                    { label: 'Jobs posted', value: business.jobsPosted },
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

              <Link href={`/borrowers/${app.borrowerId}`}>
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
              <CardTitle>Application</CardTitle>
            </CardHeader>
            <CardBody>
              <KeyValueList
                items={[
                  { label: 'Reference', value: app.id },
                  { label: 'Status', value: app.status },
                  {
                    label: 'Applied',
                    value: formatRelativeTime(app.appliedAt),
                  },
                  {
                    label: 'Submitted',
                    value: formatAbsoluteDate(app.appliedAt),
                  },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <IconUser className="!h-4 !w-4 text-neutral-500" />
                <CardTitle>Reviewers</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-xs text-neutral-500">
                Add a second reviewer for any approval over ₦2M (policy gate).
              </p>
              <Button variant="ghost" size="sm" className="mt-2">
                Request second reviewer
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
