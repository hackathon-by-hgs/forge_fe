'use client';

import { useMemo, useState } from 'react';
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
  Select,
  StatusDot,
  Switch,
} from '@forge/ui';
import {
  IconCheck,
  IconClose,
  IconShield,
} from '@forge/ui/icons';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '@forge/ui/utils';
import type { LoanApplication } from '@forge/types';
import { MOCK_EMPLOYERS, MOCK_WORKERS } from '@forge/mock-data';
import { DECISION_LABEL, DECISION_TONE } from '../../../lib/loanUtils';

type Decision = LoanApplication['recommendedDecision'];
type BorrowerType = 'worker' | 'business' | 'synthetic';

interface Scenario {
  borrowerType: BorrowerType;
  borrowerId: string | null;
  amountNaira: number;
  termMonths: 3 | 6 | 9 | 12;
  scoreOverride: number;
  onTimeRateOverride: number;
  incomeOverride: number;
  requireSecondReviewer: boolean;
}

interface ScenarioOutput {
  decision: Decision;
  confidencePct: number;
  predictedRepaymentRate: number;
  apr: number;
  monthlyInstalment: number;
  expectedTotalCollected: number;
  expectedLoss: number;
  decisionBoundary: { delta: number; nextDecision: Decision } | null;
  reasons: string[];
}

const TERM_OPTIONS: ReadonlyArray<{ label: string; value: '3' | '6' | '9' | '12' }> = [
  { label: '3 months', value: '3' },
  { label: '6 months', value: '6' },
  { label: '9 months', value: '9' },
  { label: '12 months', value: '12' },
];

function decisionForScore(score: number): Decision {
  if (score >= 80) return 'approve';
  if (score >= 65) return 'approve_with_conditions';
  return 'reject';
}

function aprForScore(score: number): number {
  // 12% at 95+, 22% at 50.
  const t = Math.max(0, Math.min(1, (95 - score) / 45));
  return 0.12 + t * 0.10;
}

function deriveOutput(s: Scenario): ScenarioOutput {
  const decision = decisionForScore(s.scoreOverride);
  const confidencePct = Math.round(
    Math.max(60, Math.min(96, 60 + (s.scoreOverride - 50) * 0.7 + s.onTimeRateOverride * 12)),
  );
  const predicted = Math.max(
    0.5,
    Math.min(
      0.99,
      0.78 +
        (s.scoreOverride - 60) / 200 +
        (s.onTimeRateOverride - 0.85) * 0.4 +
        Math.min(s.incomeOverride / 50_000, 0.05),
    ),
  );
  const apr = aprForScore(s.scoreOverride);
  const monthlyRate = apr / 12;
  const monthlyInstalment = s.amountNaira > 0
    ? Math.round(
        (s.amountNaira * monthlyRate) /
          (1 - Math.pow(1 + monthlyRate, -s.termMonths)),
      )
    : 0;
  const expectedTotal = monthlyInstalment * s.termMonths;
  const expectedLoss = Math.round(expectedTotal * (1 - predicted));

  let boundary: ScenarioOutput['decisionBoundary'] = null;
  if (decision === 'approve' && s.scoreOverride <= 82) {
    boundary = { delta: -(s.scoreOverride - 79), nextDecision: 'approve_with_conditions' };
  } else if (decision === 'approve_with_conditions') {
    if (s.scoreOverride <= 67) {
      boundary = { delta: -(s.scoreOverride - 64), nextDecision: 'reject' };
    } else if (s.scoreOverride >= 78) {
      boundary = { delta: 80 - s.scoreOverride, nextDecision: 'approve' };
    }
  } else if (decision === 'reject' && s.scoreOverride >= 63) {
    boundary = { delta: 65 - s.scoreOverride, nextDecision: 'approve_with_conditions' };
  }

  const reasons: string[] = [];
  if (s.scoreOverride >= 85) reasons.push('Score well above approve gate.');
  else if (s.scoreOverride >= 80) reasons.push('Marginal pass on score gate.');
  else if (s.scoreOverride >= 65) reasons.push('Below approve gate; conditions recommended.');
  else reasons.push('Insufficient score for any decision other than reject.');
  if (s.onTimeRateOverride >= 0.95) reasons.push('Strong on-time history (≥95%).');
  else if (s.onTimeRateOverride < 0.85) reasons.push('On-time rate below acceptable band (<85%).');
  if (s.amountNaira > 2_000_000 && !s.requireSecondReviewer) {
    reasons.push('Amount > ₦2M — second reviewer required by policy.');
  }
  if (s.incomeOverride < 12_000) reasons.push('Verified weekly income below stress-test threshold.');

  return {
    decision,
    confidencePct,
    predictedRepaymentRate: predicted,
    apr,
    monthlyInstalment,
    expectedTotalCollected: expectedTotal,
    expectedLoss,
    decisionBoundary: boundary,
    reasons,
  };
}

function defaultScenario(seed: 'A' | 'B'): Scenario {
  const isA = seed === 'A';
  return {
    borrowerType: 'worker',
    borrowerId: isA ? MOCK_WORKERS[0]?.id ?? null : MOCK_WORKERS[10]?.id ?? null,
    amountNaira: isA ? 250_000 : 750_000,
    termMonths: isA ? 6 : 9,
    scoreOverride: isA ? 82 : 70,
    onTimeRateOverride: isA ? 0.94 : 0.88,
    incomeOverride: isA ? 22_000 : 18_000,
    requireSecondReviewer: false,
  };
}

function applyBorrowerDefaults(s: Scenario): Scenario {
  if (s.borrowerType === 'synthetic' || !s.borrowerId) return s;
  if (s.borrowerType === 'worker') {
    const w = MOCK_WORKERS.find((wk) => wk.id === s.borrowerId);
    if (!w) return s;
    return {
      ...s,
      scoreOverride: w.reliabilityScore,
      onTimeRateOverride: w.onTimeRate,
      incomeOverride: w.averageWeeklyIncomeNaira,
    };
  }
  const b = MOCK_EMPLOYERS.find((bz) => bz.id === s.borrowerId);
  if (!b) return s;
  return {
    ...s,
    scoreOverride: b.creditScore,
    onTimeRateOverride: b.paymentTimelinessRate,
    incomeOverride: Math.round(b.totalLaborSpendNaira / 52),
  };
}

export default function UnderwritingSandboxPage() {
  const [scenarioA, setScenarioA] = useState<Scenario>(() =>
    applyBorrowerDefaults(defaultScenario('A')),
  );
  const [scenarioB, setScenarioB] = useState<Scenario>(() =>
    applyBorrowerDefaults(defaultScenario('B')),
  );

  const outputA = useMemo(() => deriveOutput(scenarioA), [scenarioA]);
  const outputB = useMemo(() => deriveOutput(scenarioB), [scenarioB]);

  const decisionDelta =
    outputA.decision !== outputB.decision
      ? `A → ${DECISION_LABEL[outputA.decision]} · B → ${DECISION_LABEL[outputB.decision]}`
      : 'Same recommendation';

  return (
    <>
      <PageHeader
        title="Underwriting Sandbox"
        description="Run a what-if. Adjust score, income, or terms — see how the model decides side-by-side."
        actions={
          <>
            <Button variant="ghost">Reset</Button>
            <Button variant="secondary">Save scenario</Button>
            <Button>Send to committee</Button>
          </>
        }
      />

      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Comparison summary</CardTitle>
              <p className="mt-0.5 text-xs text-neutral-500">
                Two scenarios, one model. Pick a borrower per side or run a synthetic profile.
              </p>
            </div>
            <Badge
              tone={outputA.decision === outputB.decision ? 'neutral' : 'warning'}
              variant="soft"
            >
              {decisionDelta}
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SummaryTile
                label="Predicted repayment"
                a={formatPercent(outputA.predictedRepaymentRate)}
                b={formatPercent(outputB.predictedRepaymentRate)}
                deltaBps={Math.round(
                  (outputA.predictedRepaymentRate - outputB.predictedRepaymentRate) * 10_000,
                )}
              />
              <SummaryTile
                label="Expected loss"
                a={formatCurrency(outputA.expectedLoss, { compact: true })}
                b={formatCurrency(outputB.expectedLoss, { compact: true })}
              />
              <SummaryTile
                label="Monthly instalment"
                a={formatCurrency(outputA.monthlyInstalment)}
                b={formatCurrency(outputB.monthlyInstalment)}
              />
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ScenarioPanel
            label="Scenario A"
            scenario={scenarioA}
            output={outputA}
            onChange={setScenarioA}
          />
          <ScenarioPanel
            label="Scenario B"
            scenario={scenarioB}
            output={outputB}
            onChange={setScenarioB}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconShield className="!h-4 !w-4 text-neutral-500" />
              <CardTitle>Policy gates</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <ul className="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
              <PolicyRow
                label="Score gate ≥ 65 to clear reject"
                a={scenarioA.scoreOverride >= 65}
                b={scenarioB.scoreOverride >= 65}
              />
              <PolicyRow
                label="On-time rate ≥ 85%"
                a={scenarioA.onTimeRateOverride >= 0.85}
                b={scenarioB.onTimeRateOverride >= 0.85}
              />
              <PolicyRow
                label="Verified weekly income ≥ ₦12k"
                a={scenarioA.incomeOverride >= 12_000}
                b={scenarioB.incomeOverride >= 12_000}
              />
              <PolicyRow
                label="Second reviewer for amounts > ₦2M"
                a={scenarioA.amountNaira <= 2_000_000 || scenarioA.requireSecondReviewer}
                b={scenarioB.amountNaira <= 2_000_000 || scenarioB.requireSecondReviewer}
              />
            </ul>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function SummaryTile({
  label,
  a,
  b,
  deltaBps,
}: {
  label: string;
  a: string;
  b: string;
  deltaBps?: number;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 p-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="text-sm tabular-nums text-neutral-700" data-numeric>
          A · <span className="font-semibold text-neutral-900">{a}</span>
        </span>
        <span className="text-sm tabular-nums text-neutral-700" data-numeric>
          B · <span className="font-semibold text-neutral-900">{b}</span>
        </span>
      </div>
      {typeof deltaBps === 'number' && deltaBps !== 0 ? (
        <p
          className={`mt-1 text-[11px] tabular-nums ${
            deltaBps > 0 ? 'text-success-700' : 'text-danger-700'
          }`}
          data-numeric
        >
          {deltaBps > 0 ? '+' : ''}
          {deltaBps} bps (A vs B)
        </p>
      ) : null}
    </div>
  );
}

function PolicyRow({ label, a, b }: { label: string; a: boolean; b: boolean }) {
  return (
    <li className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2">
      <span className="text-neutral-700">{label}</span>
      <span className="flex items-center gap-3 text-[10px] uppercase tracking-wide">
        <PolicyBadge label="A" pass={a} />
        <PolicyBadge label="B" pass={b} />
      </span>
    </li>
  );
}

function PolicyBadge({ label, pass }: { label: string; pass: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${
        pass
          ? 'bg-success-50 text-success-700'
          : 'bg-danger-50 text-danger-700'
      }`}
    >
      <span className="font-semibold">{label}</span>
      {pass ? (
        <IconCheck className="!h-3 !w-3" />
      ) : (
        <IconClose className="!h-3 !w-3" />
      )}
    </span>
  );
}

function ScenarioPanel({
  label,
  scenario,
  output,
  onChange,
}: {
  label: string;
  scenario: Scenario;
  output: ScenarioOutput;
  onChange: (next: Scenario) => void;
}) {
  const update = (patch: Partial<Scenario>) => onChange({ ...scenario, ...patch });
  const setBorrower = (next: { borrowerType: BorrowerType; borrowerId: string | null }) => {
    onChange(applyBorrowerDefaults({ ...scenario, ...next }));
  };

  const borrowerOptions = useMemo(() => {
    if (scenario.borrowerType === 'synthetic') return [];
    if (scenario.borrowerType === 'worker') {
      return MOCK_WORKERS.slice(0, 30).map((w) => ({
        label: `${w.fullName} · score ${w.reliabilityScore}`,
        value: w.id,
      }));
    }
    return MOCK_EMPLOYERS.slice(0, 20).map((b) => ({
      label: `${b.businessName} · score ${b.creditScore}`,
      value: b.id,
    }));
  }, [scenario.borrowerType]);

  const borrower =
    scenario.borrowerType === 'worker'
      ? MOCK_WORKERS.find((w) => w.id === scenario.borrowerId)
      : scenario.borrowerType === 'business'
        ? MOCK_EMPLOYERS.find((b) => b.id === scenario.borrowerId)
        : null;

  const borrowerName =
    scenario.borrowerType === 'synthetic'
      ? 'Synthetic profile'
      : scenario.borrowerType === 'worker'
        ? (borrower as (typeof MOCK_WORKERS)[number] | undefined)?.fullName ?? '—'
        : (borrower as (typeof MOCK_EMPLOYERS)[number] | undefined)?.businessName ?? '—';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{label}</CardTitle>
          <Badge tone={DECISION_TONE[output.decision]}>
            {DECISION_LABEL[output.decision]}
          </Badge>
          <span
            className="font-mono text-[10px] text-neutral-500 tabular-nums"
            data-numeric
          >
            {output.confidencePct}% confidence
          </span>
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        <div className="flex items-center gap-3">
          <Avatar name={borrowerName} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {borrowerName}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">
              {scenario.borrowerType}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Borrower type
            </label>
            <Select
              options={[
                { label: 'Worker', value: 'worker' },
                { label: 'Business', value: 'business' },
                { label: 'Synthetic', value: 'synthetic' },
              ]}
              value={scenario.borrowerType}
              onChange={(e) =>
                setBorrower({
                  borrowerType: e.target.value as BorrowerType,
                  borrowerId:
                    e.target.value === 'worker'
                      ? MOCK_WORKERS[0]?.id ?? null
                      : e.target.value === 'business'
                        ? MOCK_EMPLOYERS[0]?.id ?? null
                        : null,
                })
              }
            />
          </div>
          {scenario.borrowerType !== 'synthetic' ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">
                Borrower
              </label>
              <Select
                options={borrowerOptions}
                value={scenario.borrowerId ?? ''}
                onChange={(e) =>
                  setBorrower({ borrowerType: scenario.borrowerType, borrowerId: e.target.value })
                }
              />
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Amount requested ·{' '}
              <span className="font-mono tabular-nums text-neutral-900" data-numeric>
                {formatCurrency(scenario.amountNaira, { compact: true })}
              </span>
            </label>
            <input
              type="range"
              min={20_000}
              max={5_000_000}
              step={10_000}
              value={scenario.amountNaira}
              onChange={(e) => update({ amountNaira: Number(e.target.value) })}
              className="w-full accent-accent-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">Term</label>
            <Select
              options={TERM_OPTIONS}
              value={String(scenario.termMonths)}
              onChange={(e) =>
                update({ termMonths: Number(e.target.value) as Scenario['termMonths'] })
              }
            />
          </div>
        </div>

        <div className="space-y-3 rounded-md border border-neutral-200 p-3">
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">
            Override factors
          </p>
          <RangeRow
            label="Score"
            value={scenario.scoreOverride}
            min={40}
            max={100}
            step={1}
            display={String(scenario.scoreOverride)}
            onChange={(v) => update({ scoreOverride: v })}
          />
          <RangeRow
            label="On-time rate"
            value={Math.round(scenario.onTimeRateOverride * 100)}
            min={50}
            max={100}
            step={1}
            display={`${Math.round(scenario.onTimeRateOverride * 100)}%`}
            onChange={(v) => update({ onTimeRateOverride: v / 100 })}
          />
          <RangeRow
            label="Avg weekly income"
            value={scenario.incomeOverride}
            min={5_000}
            max={80_000}
            step={500}
            display={formatCurrency(scenario.incomeOverride, { compact: true })}
            onChange={(v) => update({ incomeOverride: v })}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border border-neutral-200 p-3 text-xs">
          <div>
            <p className="font-medium text-neutral-900">Require second reviewer</p>
            <p className="text-neutral-500">
              Auto-required for amounts above ₦2M.
            </p>
          </div>
          <Switch
            checked={scenario.requireSecondReviewer}
            onCheckedChange={(checked) => update({ requireSecondReviewer: checked })}
          />
        </div>

        <KeyValueList
          layout="grid"
          items={[
            {
              label: 'Recommended',
              value: (
                <Badge tone={DECISION_TONE[output.decision]} variant="soft">
                  {DECISION_LABEL[output.decision]}
                </Badge>
              ),
            },
            { label: 'Confidence', value: `${output.confidencePct}%` },
            {
              label: 'APR',
              value: formatPercent(output.apr),
            },
            {
              label: 'Predicted repayment',
              value: formatPercent(output.predictedRepaymentRate),
            },
            {
              label: 'Monthly instalment',
              value: formatCurrency(output.monthlyInstalment),
            },
            {
              label: 'Expected total collected',
              value: formatCurrency(output.expectedTotalCollected),
            },
            {
              label: 'Expected loss',
              value: formatCurrency(output.expectedLoss),
            },
            {
              label: 'Number of payments',
              value: formatNumber(scenario.termMonths),
            },
          ]}
        />

        {output.decisionBoundary ? (
          <div className="flex items-start gap-2 rounded-md border border-warning-500/30 bg-warning-50/40 p-3 text-xs text-warning-700">
            <StatusDot tone="warning" />
            <div>
              <p className="font-medium">Decision boundary close</p>
              <p>
                {output.decisionBoundary.delta > 0 ? '+' : ''}
                {output.decisionBoundary.delta} score points →{' '}
                <span className="font-semibold">
                  {DECISION_LABEL[output.decisionBoundary.nextDecision]}
                </span>
                .
              </p>
            </div>
          </div>
        ) : null}

        {output.reasons.length > 0 ? (
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-wider text-neutral-500">
              Why
            </p>
            <ul className="space-y-1.5 text-xs text-neutral-700">
              {output.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-neutral-400" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

function RangeRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label className="text-xs font-medium text-neutral-700">{label}</label>
        <span
          className="font-mono text-xs font-medium text-neutral-900 tabular-nums"
          data-numeric
        >
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent-600"
      />
    </div>
  );
}
