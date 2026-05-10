'use client';

import {
  AreaChart,
  Badge,
  BarChart,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DonutChart,
  MetricTile,
  PageHeader,
} from '@forge/ui';
import { IconExternal } from '@forge/ui/icons';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '@forge/ui/utils';
import type { LoanStatus } from '@forge/types';
import { MOCK_BANKS, MOCK_LOANS } from '@forge/mock-data';
import {
  RISK_TONE,
  STATUS_LABEL,
  STATUS_TONE,
} from '../../../lib/loanUtils';

const SCORE_BANDS: ReadonlyArray<{ label: string; min: number; max: number }> = [
  { label: '90–100', min: 90, max: 100 },
  { label: '80–89', min: 80, max: 89 },
  { label: '70–79', min: 70, max: 79 },
  { label: '60–69', min: 60, max: 69 },
];

export default function PortfolioPage() {
  const bank = MOCK_BANKS[0];
  const loans = MOCK_LOANS;
  const live = loans.filter((l) => l.status === 'active' || l.status === 'at_risk');

  const totalPrincipal = loans.reduce((s, l) => s + l.principalNaira, 0);
  const totalOutstanding = live.reduce((s, l) => s + l.outstandingNaira, 0);
  const totalCollected = loans
    .filter((l) => l.status === 'repaid')
    .reduce((s, l) => s + l.principalNaira, 0);
  const writeOffs = loans
    .filter((l) => l.status === 'defaulted' || l.status === 'written_off')
    .reduce((s, l) => s + l.outstandingNaira, 0);

  const riskMix = (['green', 'yellow', 'red'] as const).map((r) => ({
    name: r === 'green' ? 'Healthy' : r === 'yellow' ? 'Watch' : 'Critical',
    value: live.filter((l) => l.riskLevel === r).length,
  }));

  const borrowerMix = (['worker', 'business'] as const).map((t) => ({
    name: t === 'worker' ? 'Workers' : 'Businesses',
    value: live.filter((l) => l.borrowerType === t).length,
  }));

  const statusMix = (Object.keys(STATUS_LABEL) as LoanStatus[])
    .map((s) => ({
      status: STATUS_LABEL[s],
      key: s,
      count: loans.filter((l) => l.status === s).length,
    }))
    .filter((row) => row.count > 0);

  // Synthetic 8-week disbursement trend, cobbled from disbursedAt timestamps.
  const now = Date.now();
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = now - (7 - i) * 7 * 24 * 60 * 60 * 1000;
    const start = end - 7 * 24 * 60 * 60 * 1000;
    const disbursed = loans
      .filter((l) => {
        if (!l.disbursedAt) return false;
        const t = new Date(l.disbursedAt).getTime();
        return t >= start && t < end;
      })
      .reduce((s, l) => s + l.principalNaira, 0);
    const label = new Date(end).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
    });
    return { week: label, disbursedNaira: disbursed };
  });

  const cohortByType = (['worker', 'business'] as const).map((t) => {
    const rows = loans.filter((l) => l.borrowerType === t);
    const liveRows = rows.filter(
      (l) => l.status === 'active' || l.status === 'at_risk',
    );
    const outstanding = liveRows.reduce((s, l) => s + l.outstandingNaira, 0);
    const principal = rows.reduce((s, l) => s + l.principalNaira, 0);
    const repaid = rows.filter((l) => l.status === 'repaid').length;
    const defaulted = rows.filter(
      (l) => l.status === 'defaulted' || l.status === 'written_off',
    ).length;
    const onTimeRate =
      rows.length > 0 ? (rows.length - defaulted) / rows.length : 0;
    return {
      label: t === 'worker' ? 'Workers' : 'Businesses',
      count: rows.length,
      principal,
      outstanding,
      repaid,
      defaulted,
      onTimeRate,
    };
  });

  const cohortByScore = SCORE_BANDS.map((band) => {
    const rows = loans.filter(
      (l) => l.scoreAtApproval >= band.min && l.scoreAtApproval <= band.max,
    );
    const defaulted = rows.filter(
      (l) => l.status === 'defaulted' || l.status === 'written_off',
    ).length;
    const principal = rows.reduce((s, l) => s + l.principalNaira, 0);
    const defaultRate = rows.length > 0 ? defaulted / rows.length : 0;
    return { ...band, count: rows.length, principal, defaulted, defaultRate };
  });

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Composition, performance, and concentration — the whole book in one view."
        actions={
          <>
            <Button variant="secondary">Snapshot CSV</Button>
            <Button
              variant="secondary"
              leadingIcon={<IconExternal className="!h-4 !w-4" />}
            >
              Open in attribution
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Total disbursed"
            value={formatCurrency(bank?.totalDisbursedNaira ?? totalPrincipal, { compact: true })}
            delta={{ pct: 14.3, direction: 'up', label: 'this month' }}
            trend={[11, 13, 14, 15, 17, 18, 18.5]}
          />
          <MetricTile
            label="Outstanding"
            value={formatCurrency(totalOutstanding, { compact: true })}
            hint={`${live.length} live loans`}
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
              <div>
                <CardTitle>Disbursements — last 8 weeks</CardTitle>
                <p className="mt-0.5 text-xs text-neutral-500">Principal disbursed per week.</p>
              </div>
              <Badge tone="success" variant="soft">+14.3%</Badge>
            </CardHeader>
            <CardBody>
              <AreaChart
                data={weeks}
                xKey="week"
                yKey="disbursedNaira"
                yFormatter={(v) => formatCurrency(v, { compact: true })}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk mix</CardTitle>
              <p className="text-xs text-neutral-500">{live.length} live</p>
            </CardHeader>
            <CardBody>
              <DonutChart
                data={riskMix}
                centerLabel="live loans"
                centerValue={String(live.length)}
              />
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>By borrower type</CardTitle>
            </CardHeader>
            <CardBody>
              <DonutChart
                data={borrowerMix}
                centerLabel="live loans"
                centerValue={String(live.length)}
              />
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Status composition</CardTitle>
              <p className="text-xs text-neutral-500">{loans.length} total</p>
            </CardHeader>
            <CardBody>
              <BarChart
                data={statusMix}
                xKey="status"
                yKey="count"
                yFormatter={(v) => formatNumber(v)}
              />
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Cohort — by borrower type</CardTitle>
                <p className="mt-0.5 text-xs text-neutral-500">
                  How each segment is performing across the book.
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="py-2 text-left font-medium">Segment</th>
                    <th className="py-2 text-right font-medium">Loans</th>
                    <th className="py-2 text-right font-medium">Principal</th>
                    <th className="py-2 text-right font-medium">Outstanding</th>
                    <th className="py-2 text-right font-medium">Repaid</th>
                    <th className="py-2 text-right font-medium">Default</th>
                    <th className="py-2 text-right font-medium">On-time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {cohortByType.map((row) => (
                    <tr key={row.label}>
                      <td className="py-2.5 font-medium text-neutral-900">{row.label}</td>
                      <td className="py-2.5 text-right tabular-nums" data-numeric>
                        {row.count}
                      </td>
                      <td className="py-2.5 text-right tabular-nums" data-numeric>
                        {formatCurrency(row.principal, { compact: true })}
                      </td>
                      <td className="py-2.5 text-right tabular-nums" data-numeric>
                        {formatCurrency(row.outstanding, { compact: true })}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-success-700" data-numeric>
                        {row.repaid}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-danger-700" data-numeric>
                        {row.defaulted}
                      </td>
                      <td className="py-2.5 text-right tabular-nums" data-numeric>
                        {formatPercent(row.onTimeRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Cohort — by approval score</CardTitle>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Default rate by score band — the policy gate is working as expected when it slopes down.
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="py-2 text-left font-medium">Score band</th>
                    <th className="py-2 text-right font-medium">Loans</th>
                    <th className="py-2 text-right font-medium">Principal</th>
                    <th className="py-2 text-right font-medium">Defaulted</th>
                    <th className="py-2 text-right font-medium">Default rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {cohortByScore.map((row) => {
                    const tone =
                      row.defaultRate >= 0.1
                        ? 'text-danger-700'
                        : row.defaultRate >= 0.05
                          ? 'text-warning-700'
                          : 'text-success-700';
                    return (
                      <tr key={row.label}>
                        <td className="py-2.5 font-medium text-neutral-900">
                          {row.label}
                        </td>
                        <td className="py-2.5 text-right tabular-nums" data-numeric>
                          {row.count}
                        </td>
                        <td className="py-2.5 text-right tabular-nums" data-numeric>
                          {formatCurrency(row.principal, { compact: true })}
                        </td>
                        <td className="py-2.5 text-right tabular-nums" data-numeric>
                          {row.defaulted}
                        </td>
                        <td className={`py-2.5 text-right font-medium tabular-nums ${tone}`} data-numeric>
                          {formatPercent(row.defaultRate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Concentration & exposure</CardTitle>
              <p className="mt-0.5 text-xs text-neutral-500">
                Top exposures and write-off impact.
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-neutral-200 p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Total collected (lifetime)
                </p>
                <p className="mt-1 text-xl font-semibold text-neutral-900 tabular-nums" data-numeric>
                  {formatCurrency(totalCollected, { compact: true })}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Across {loans.filter((l) => l.status === 'repaid').length} fully repaid loans.
                </p>
              </div>
              <div className="rounded-lg border border-warning-500/30 bg-warning-50/40 p-4">
                <p className="text-xs uppercase tracking-wide text-warning-700">
                  Write-offs & defaults
                </p>
                <p className="mt-1 text-xl font-semibold text-neutral-900 tabular-nums" data-numeric>
                  {formatCurrency(writeOffs, { compact: true })}
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  {loans.filter((l) => l.status === 'defaulted').length} defaulted ·{' '}
                  {loans.filter((l) => l.status === 'written_off').length} written off
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Largest single exposure
                </p>
                {(() => {
                  const top = [...live].sort(
                    (a, b) => b.outstandingNaira - a.outstandingNaira,
                  )[0];
                  if (!top) {
                    return (
                      <p className="mt-1 text-sm text-neutral-500">No live loans.</p>
                    );
                  }
                  return (
                    <>
                      <p className="mt-1 text-xl font-semibold text-neutral-900 tabular-nums" data-numeric>
                        {formatCurrency(top.outstandingNaira)}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-neutral-600">
                        <span className="font-mono">{top.id}</span>
                        <Badge tone={RISK_TONE[top.riskLevel]} variant="soft">
                          {top.riskLevel}
                        </Badge>
                        <Badge tone={STATUS_TONE[top.status]} variant="soft">
                          {STATUS_LABEL[top.status]}
                        </Badge>
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
