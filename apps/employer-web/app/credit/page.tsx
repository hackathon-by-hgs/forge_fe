'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  FormField,
  Input,
  KeyValueList,
  LineChart,
  PageHeader,
  RadialProgress,
  Skeleton,
  Sparkline,
  Textarea,
} from '@forge/ui';
import { IconCheck, IconCredit } from '@forge/ui/icons';
import { formatCurrency } from '@forge/ui/utils';
import { useAuth } from '../../lib/auth';
import { canPatchBusinessSquadBilling } from '../../lib/roles';
import {
  createLoanApplication,
  getCredit,
  type CreateEmployerLoanApplicationInput,
  type EmployerCreditDto,
  type EmployerLoanSummary,
} from '../../lib/creditApi';
import { ApiError } from '../../lib/api';

export default function CreditPage() {
  const role = useAuth((s) => s.user?.role);
  const canApply = canPatchBusinessSquadBilling(role);

  const creditQuery = useQuery({
    queryKey: ['employer', 'credit'],
    queryFn: getCredit,
    retry: false,
  });

  const [showApply, setShowApply] = useState(false);

  if (creditQuery.isLoading) {
    return (
      <>
        <PageHeader title="Credit & Loans" />
        <div className="space-y-6 p-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </>
    );
  }

  if (creditQuery.isError) {
    return (
      <>
        <PageHeader title="Credit & Loans" />
        <div className="p-6">
          <AlertBanner
            tone="danger"
            title="Couldn’t load credit"
            description={
              creditQuery.error instanceof Error
                ? creditQuery.error.message
                : 'Unknown error'
            }
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void creditQuery.refetch()}
              >
                Retry
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const credit = creditQuery.data;
  if (!credit) return null;

  return (
    <>
      <PageHeader
        title="Credit & Loans"
        description="Borrow against your verified hiring history."
        actions={
          canApply && credit.eligibility.tier !== 'ineligible' ? (
            <Button onClick={() => setShowApply(true)}>Apply for a loan</Button>
          ) : null
        }
      />

      <div className="space-y-6 p-6">
        <CreditHero credit={credit} />

        {credit.eligibility.tier === 'ineligible' ? (
          <AlertBanner
            tone="warning"
            title="Not yet eligible for a business loan"
            description="Keep paying workers on time and your score will climb. Eligibility kicks in at 70."
          />
        ) : (
          <AlertBanner
            tone="success"
            icon={<IconCheck className="!h-4 !w-4" />}
            title={`You're eligible for a business loan up to ${formatCurrency(credit.eligibility.maxAmountNaira)}`}
            description={`${(credit.eligibility.aprPct * 100).toFixed(0)}% APR · indicative · ${
              credit.eligibility.estimatedDecisionAt
                ? 'decision within 24 hours of applying'
                : 'apply to confirm'
            }`}
            action={
              canApply ? (
                <Button size="sm" onClick={() => setShowApply(true)}>
                  Apply now
                </Button>
              ) : undefined
            }
          />
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ActiveLoanCard active={credit.activeLoan} />
          <FactorsCard credit={credit} />
        </div>

        <PastLoansCard loans={credit.pastLoans} />
      </div>

      {canApply ? (
        <ApplyDialog
          open={showApply}
          onOpenChange={setShowApply}
          maxAmountNaira={credit.eligibility.maxAmountNaira}
          tier={credit.eligibility.tier}
        />
      ) : null}
    </>
  );
}

function CreditHero({ credit }: { credit: EmployerCreditDto }) {
  const trend = credit.trend12Week.map((p) => ({
    week: p.date,
    score: p.score,
  }));
  return (
    <Card>
      <CardBody className="grid grid-cols-1 items-center gap-6 md:grid-cols-3">
        <div className="flex items-center gap-6">
          <RadialProgress value={credit.score} label="Credit score" />
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-400">
              Business credit score
            </p>
            <p
              className="mt-1 text-3xl font-semibold text-neutral-900 tabular-nums"
              data-numeric
            >
              {credit.score}
            </p>
            {credit.scoreDeltaPoints !== 0 ? (
              <p
                className={`mt-1 inline-flex items-center gap-1 text-xs ${
                  credit.scoreDeltaPoints > 0
                    ? 'text-success-600'
                    : 'text-danger-600'
                }`}
              >
                <span aria-hidden>{credit.scoreDeltaPoints > 0 ? '↑' : '↓'}</span>
                <span>
                  {credit.scoreDeltaPoints > 0 ? '+' : ''}
                  {credit.scoreDeltaPoints} vs 12 weeks ago
                </span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-neutral-400">12-week history pending</p>
            )}
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
  );
}

function ActiveLoanCard({ active }: { active: EmployerLoanSummary | null }) {
  if (!active) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Active loan</CardTitle>
        </CardHeader>
        <CardBody>
          <EmptyState
            icon={<IconCredit className="!h-5 !w-5" />}
            title="No active loan"
            description="Apply for a business loan against your verified hiring history."
          />
        </CardBody>
      </Card>
    );
  }

  const repaymentProgress =
    active.principalNaira > 0
      ? 1 - active.outstandingNaira / active.principalNaira
      : 0;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Active loan</CardTitle>
        <Badge
          tone={
            active.riskLevel === 'green'
              ? 'success'
              : active.riskLevel === 'yellow'
                ? 'warning'
                : 'danger'
          }
        >
          {active.riskLevel === 'green'
            ? 'On track'
            : active.riskLevel === 'yellow'
              ? 'Watch'
              : 'Critical'}
        </Badge>
      </CardHeader>
      <CardBody className="space-y-4">
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
        <KeyValueList
          items={[
            { label: 'Bank', value: active.bankName ?? '—' },
            {
              label: 'Term',
              value: active.termMonths ? `${active.termMonths} months` : '—',
            },
            {
              label: 'Next payment due',
              value: active.nextPaymentDueAt
                ? new Date(active.nextPaymentDueAt).toLocaleDateString()
                : '—',
            },
            {
              label: 'Expected full repayment',
              value: active.expectedFullRepaymentAt
                ? new Date(active.expectedFullRepaymentAt).toLocaleDateString()
                : '—',
            },
          ]}
        />
        <Link href={`/credit/loans/${active.id}`} className="text-xs font-medium text-accent-600 hover:underline">
          View full loan →
        </Link>
      </CardBody>
    </Card>
  );
}

function FactorsCard({ credit }: { credit: EmployerCreditDto }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What moves your score</CardTitle>
      </CardHeader>
      <CardBody>
        <ul className="space-y-3">
          {credit.factors.map((f) => (
            <li key={f.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-neutral-900">{f.label}</span>
                <span className="text-xs text-neutral-500 tabular-nums" data-numeric>
                  {(f.value * 100).toFixed(0)}% · weight {(f.weight * 100).toFixed(0)}%
                </span>
              </div>
              <p className="mt-0.5 text-xs text-neutral-500">{f.rationale}</p>
              <Sparkline
                data={f.trend.map((v) => v * 100)}
                className="mt-1 h-5 w-full"
              />
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

function PastLoansCard({ loans }: { loans: EmployerLoanSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Past loans</CardTitle>
        <Badge variant="soft">{loans.length}</Badge>
      </CardHeader>
      <CardBody>
        {loans.length === 0 ? (
          <EmptyState
            title="No loan history yet"
            description="Repay your first loan and the history shows here."
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {loans.slice(0, 8).map((l) => (
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
                    {l.bankName ?? '—'} ·{' '}
                    {l.termMonths ? `${l.termMonths} months` : '—'} · {l.status}
                  </p>
                </div>
                <Badge
                  tone={
                    l.status === 'repaid'
                      ? 'success'
                      : l.status === 'defaulted' || l.status === 'written_off'
                        ? 'danger'
                        : l.status === 'rejected'
                          ? 'neutral'
                          : 'warning'
                  }
                  variant="soft"
                >
                  {l.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function ApplyDialog({
  open,
  onOpenChange,
  maxAmountNaira,
  tier,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maxAmountNaira: number;
  tier: EmployerCreditDto['eligibility']['tier'];
}) {
  const queryClient = useQueryClient();
  const [amountNaira, setAmountNaira] = useState<number>(
    Math.min(500_000, Math.max(10_000, maxAmountNaira)),
  );
  const [termMonths, setTermMonths] = useState<number>(6);
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    decision: string;
    confidencePct: number;
    reason: string;
  } | null>(null);

  const mutate = useMutation({
    mutationFn: (input: CreateEmployerLoanApplicationInput) =>
      createLoanApplication(input),
    onSuccess: (app) => {
      void queryClient.invalidateQueries({ queryKey: ['employer', 'credit'] });
      setResult({
        decision: app.recommendedDecision,
        confidencePct: app.recommendationConfidencePct,
        reason: app.recommendationReason,
      });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'NO_LENDERS_AVAILABLE') {
        setError('No lenders are accepting applications right now. Try again later.');
        return;
      }
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Application failed',
      );
    },
  });

  const reset = () => {
    setAmountNaira(Math.min(500_000, Math.max(10_000, maxAmountNaira)));
    setTermMonths(6);
    setPurpose('');
    setError(null);
    setResult(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (amountNaira < 10_000 || amountNaira > 5_000_000) {
      setError('Amount must be between ₦10,000 and ₦5,000,000');
      return;
    }
    if (termMonths < 1 || termMonths > 24) {
      setError('Term must be 1–24 months');
      return;
    }
    mutate.mutate({
      amountNaira,
      termMonths,
      purpose: purpose.trim() || undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>Application filed</DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-3">
              <p className="text-sm text-neutral-600">
                The bank will make the binding decision. Here&apos;s the model&apos;s
                indicative read:
              </p>
              <div className="rounded-lg border border-outline bg-surface p-3">
                <div className="flex items-center justify-between">
                  <Badge
                    tone={
                      result.decision === 'approve'
                        ? 'success'
                        : result.decision === 'reject'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {result.decision}
                  </Badge>
                  <span
                    className="text-xs font-medium text-neutral-700 tabular-nums"
                    data-numeric
                  >
                    {result.confidencePct}% confidence
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-700">{result.reason}</p>
              </div>
              <p className="text-xs text-neutral-500">
                You can track the application status from the bank&apos;s review queue.
                Your next loan, once approved + disbursed, appears on this page.
              </p>
            </DialogBody>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Apply for a loan</DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-3">
              <p className="text-xs text-neutral-500">
                Indicative cap at your current tier ({tier}):{' '}
                <span className="font-medium text-neutral-700" data-numeric>
                  {formatCurrency(maxAmountNaira)}
                </span>
                . Final decision rests with the bank.
              </p>
              <FormField
                label="Amount (₦)"
                required
                hint={amountNaira ? formatCurrency(amountNaira) : undefined}
              >
                <Input
                  type="number"
                  min={10_000}
                  max={5_000_000}
                  step={10_000}
                  value={amountNaira}
                  onChange={(e) => setAmountNaira(Number(e.target.value))}
                />
              </FormField>
              <FormField label="Term (months)" required>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  step={1}
                  value={termMonths}
                  onChange={(e) => setTermMonths(Number(e.target.value))}
                />
              </FormField>
              <FormField label="Purpose (optional)">
                <Textarea
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Buying a second pickup truck for the Apapa run."
                />
              </FormField>
              {error ? <p className="text-xs text-danger-600">{error}</p> : null}
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={mutate.isPending}>
                File application
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
