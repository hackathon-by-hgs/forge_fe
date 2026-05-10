import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  AreaChart,
  Avatar,
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
  Sparkline,
} from '@forge/ui';
import {
  IconBank,
  IconBriefcase,
  IconCheck,
  IconExternal,
  IconLocation,
  IconShield,
} from '@forge/ui/icons';
import {
  formatAbsoluteDate,
  formatCurrency,
  formatPercent,
  formatRelativeTime,
  formatShortDate,
} from '@forge/ui/utils';
import {
  getEmployerById,
  getIncomeHistory,
  getScoreFactors,
  getScoreHistory,
  getWorkerById,
  MOCK_JOBS,
  MOCK_LOAN_APPLICATIONS,
  MOCK_LOANS,
} from '@forge/mock-data';
import {
  RISK_TONE,
  STATUS_LABEL,
  STATUS_TONE,
} from '../../../../lib/loanUtils';

export default function BorrowerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const worker = getWorkerById(params.id);
  const business = !worker ? getEmployerById(params.id) : null;
  if (!worker && !business) notFound();

  const isWorker = !!worker;
  const name = worker?.fullName ?? business?.businessName ?? params.id;
  const score = worker?.reliabilityScore ?? business?.creditScore ?? 0;
  const eligibilityLabel = worker
    ? worker.eligibility.replace(/_/g, ' ')
    : business && business.creditScore >= 80
      ? 'pre approved'
      : business && business.creditScore >= 65
        ? 'eligible'
        : 'ineligible';
  const eligibilityTone =
    eligibilityLabel === 'pre approved'
      ? 'success'
      : eligibilityLabel === 'eligible'
        ? 'info'
        : 'neutral';

  const factors = worker ? getScoreFactors(worker.id) : [];
  const scoreHistory = worker
    ? getScoreHistory(worker.id).map((p) => ({ date: p.date, score: p.score }))
    : [];
  const incomeHistory = worker
    ? getIncomeHistory(worker.id).map((p) => ({
        weekStart: p.weekStart,
        amountNaira: p.amountNaira,
      }))
    : [];
  const loans = MOCK_LOANS.filter((l) => l.borrowerId === params.id);
  const liveLoans = loans.filter(
    (l) => l.status === 'active' || l.status === 'at_risk',
  );
  const totalOutstanding = liveLoans.reduce(
    (s, l) => s + l.outstandingNaira,
    0,
  );
  const applications = MOCK_LOAN_APPLICATIONS.filter(
    (a) => a.borrowerId === params.id,
  );
  const completedJobs = isWorker
    ? MOCK_JOBS.filter((j) => j.assignedWorkerId === worker?.id)
    : MOCK_JOBS.filter((j) => j.employerId === business?.id);

  return (
    <>
      <PageHeader
        title={name}
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers/workers' },
          { label: 'Profile' },
        ]}
        actions={
          <>
            <Button variant="ghost">Add to watchlist</Button>
            <Button variant="secondary">Send outreach</Button>
            <Button leadingIcon={<IconCheck className="!h-4 !w-4" />}>
              Pre-approve
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-6">
        <Card>
          <CardBody>
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <Avatar
                name={name}
                size="lg"
                className="!h-20 !w-20 !text-base"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold text-neutral-900">{name}</p>
                  <Badge variant="soft">
                    {isWorker ? 'Worker' : 'Business'}
                  </Badge>
                  <Badge tone={eligibilityTone} variant="soft">
                    {eligibilityLabel}
                  </Badge>
                </div>
                <p className="text-sm text-neutral-500">
                  {worker
                    ? `${worker.primarySkill} · joined ${formatRelativeTime(worker.joinedAt)}`
                    : business
                      ? `${business.type} · joined ${formatRelativeTime(business.joinedAt)}`
                      : ''}
                </p>
                <p className="inline-flex items-center gap-1 text-xs text-neutral-500">
                  <IconLocation className="!h-3 !w-3" />
                  {worker?.homeLocation.neighborhood ??
                    business?.registeredLocation.neighborhood ??
                    'Lagos'}
                  , Lagos
                  {worker ? (
                    <>
                      {' · '}
                      <span className="font-mono">{worker.phone}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <RadialProgress
                value={score}
                label={isWorker ? 'Reliability' : 'Credit'}
              />
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardBody>
              <p className="text-xs text-neutral-500">
                {isWorker ? 'Jobs completed' : 'Jobs posted'}
              </p>
              <p
                className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {worker?.jobsCompleted ?? business?.jobsPosted ?? 0}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-neutral-500">
                {isWorker ? 'Lifetime earned' : 'Lifetime spend'}
              </p>
              <p
                className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {formatCurrency(
                  worker?.totalEarnedNaira ?? business?.totalLaborSpendNaira ?? 0,
                  { compact: true },
                )}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-neutral-500">
                {isWorker ? 'On-time rate' : 'Payment timeliness'}
              </p>
              <p
                className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {formatPercent(
                  worker?.onTimeRate ?? business?.paymentTimelinessRate ?? 0,
                )}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-neutral-500">Outstanding</p>
              <p
                className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {formatCurrency(totalOutstanding, { compact: true })}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {liveLoans.length} live loan{liveLoans.length === 1 ? '' : 's'}
              </p>
            </CardBody>
          </Card>
        </div>

        {worker ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Score history</CardTitle>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    7-month trajectory of the platform reliability score.
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                <LineChart
                  data={scoreHistory}
                  xKey="date"
                  series={[{ key: 'score', label: 'Reliability' }]}
                  xFormatter={(v) => formatShortDate(v as string)}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Verified weekly income</CardTitle>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Squad-settled earnings, last 26 weeks. Volatility{' '}
                    <span className="font-medium text-neutral-900">
                      {formatPercent(worker.incomeVolatilityPct)}
                    </span>
                    .
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                <AreaChart
                  data={incomeHistory}
                  xKey="weekStart"
                  yKey="amountNaira"
                  yFormatter={(v) => formatCurrency(v, { compact: true })}
                  xFormatter={(v) => formatShortDate(v as string)}
                />
              </CardBody>
            </Card>
          </div>
        ) : null}

        {factors.length > 0 ? (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Score factor breakdown</CardTitle>
                <p className="mt-0.5 text-xs text-neutral-500">
                  How each input weighs into the headline score.
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
                      <td
                        className="py-3 text-right tabular-nums text-neutral-600"
                        data-numeric
                      >
                        {formatPercent(f.weight)}
                      </td>
                      <td className="py-3">
                        <Sparkline
                          data={f.trend.map((v) => v * 100)}
                          className="h-6 w-24"
                        />
                      </td>
                      <td className="py-3 text-xs text-neutral-600">{f.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Loan history</CardTitle>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Every disbursement, every outcome.
                </p>
              </div>
              <Badge>{loans.length}</Badge>
            </CardHeader>
            <CardBody>
              {loans.length === 0 ? (
                <EmptyState
                  icon={<IconBank className="!h-5 !w-5" />}
                  title="No loans on file"
                  description="No prior disbursements for this borrower."
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
                    {loans.map((l) => (
                      <tr key={l.id}>
                        <td
                          className="py-2.5 font-mono text-xs text-neutral-700"
                          data-numeric
                        >
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

          <Card>
            <CardHeader>
              <CardTitle>Open applications</CardTitle>
              <Badge variant="soft">{applications.length}</Badge>
            </CardHeader>
            <CardBody>
              {applications.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-500">
                  No applications in the queue.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100 text-sm">
                  {applications.slice(0, 5).map((a) => (
                    <li key={a.id} className="py-2.5 first:pt-0 last:pb-0">
                      <Link
                        href={`/applications/${a.id}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        <span
                          className="font-mono text-xs text-neutral-500"
                          data-numeric
                        >
                          {a.id}
                        </span>
                        <span
                          className="flex-1 tabular-nums text-neutral-700"
                          data-numeric
                        >
                          {formatCurrency(a.amountRequestedNaira, { compact: true })}
                        </span>
                        <Badge variant="soft">{a.status}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconBriefcase className="!h-4 !w-4 text-neutral-500" />
              <CardTitle>
                {isWorker ? 'Verified work history' : 'Hiring history'}
              </CardTitle>
            </div>
            <Badge variant="soft">{completedJobs.length}</Badge>
          </CardHeader>
          <CardBody>
            {completedJobs.length === 0 ? (
              <EmptyState
                title="No verified jobs yet"
                description={
                  isWorker
                    ? 'Once jobs complete with photo proof and Squad settlement, they appear here.'
                    : 'Jobs this business has posted will appear here.'
                }
              />
            ) : (
              <ul className="divide-y divide-neutral-100 text-sm">
                {completedJobs.slice(0, 8).map((j) => (
                  <li
                    key={j.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span
                      className="font-mono text-[10px] text-neutral-500"
                      data-numeric
                    >
                      {j.id}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {j.title}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {j.location.neighborhood} · {j.durationHours}h ·{' '}
                        {formatRelativeTime(j.postedAt)}
                      </p>
                    </div>
                    <span
                      className="tabular-nums text-sm font-medium text-neutral-900"
                      data-numeric
                    >
                      {formatCurrency(j.payNaira)}
                    </span>
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
              <CardTitle>Identity & KYC</CardTitle>
            </div>
            <Badge tone="success" variant="soft">Verified</Badge>
          </CardHeader>
          <CardBody>
            <KeyValueList
              layout="grid"
              items={[
                {
                  label: 'Member since',
                  value: formatAbsoluteDate(
                    worker?.joinedAt ?? business?.joinedAt ?? new Date().toISOString(),
                  ),
                },
                { label: 'Identity check', value: 'Passed (NIN + selfie)' },
                {
                  label: isWorker ? 'Phone' : 'Registered location',
                  value: isWorker
                    ? worker!.phone
                    : business
                      ? `${business.registeredLocation.neighborhood}`
                      : '—',
                },
                { label: 'Sanctions screening', value: 'Clear' },
              ]}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
