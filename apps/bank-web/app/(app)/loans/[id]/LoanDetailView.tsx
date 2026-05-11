'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertBanner,
  Avatar,
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
  FormField,
  Input,
  KeyValueList,
  PageHeader,
  RadialProgress,
  Skeleton,
  StatusDot,
} from '@forge/ui';
import { IconExternal } from '@forge/ui/icons';
import {
  formatAbsoluteDate,
  formatCurrency,
  formatPercent,
  formatRelativeTime,
  formatShortDate,
} from '@forge/ui/utils';
import {
  disburseLoan,
  fetchLoanDetail,
  markRepaymentPaid,
  type LoanDetailDto,
  type LoanRepaymentDto,
} from '../../../../lib/api/bankApi';
import { ApiError, toUserMessage } from '../../../../lib/api/errors';
import { useAuthStore } from '../../../../lib/auth/store';
import {
  REPAYMENT_LABEL,
  REPAYMENT_TONE,
  RISK_LABEL,
  RISK_TONE,
  STATUS_LABEL,
  STATUS_TONE,
  canDisburse,
  canMarkRepaymentPaid,
  isCreditOfficer,
} from '../../../../lib/loanUtils';

export function LoanDetailView({ loanId }: { loanId: string }) {
  const role = useAuthStore((s) => s.user?.role);
  const canMutate = isCreditOfficer(role);
  const queryClient = useQueryClient();

  const detail = useQuery({
    queryKey: ['bank', 'loans', loanId],
    queryFn: () => fetchLoanDetail(loanId),
    retry: false,
  });

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showDisburse, setShowDisburse] = useState(false);
  const [principalOverride, setPrincipalOverride] = useState<string>('');

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['bank', 'loans', loanId] });
    void queryClient.invalidateQueries({ queryKey: ['bank', 'loans'] });
    void queryClient.invalidateQueries({ queryKey: ['bank', 'risk-radar'] });
  };

  const disburseMutation = useMutation({
    mutationFn: (override?: number) =>
      disburseLoan(loanId, override ? { principalNairaOverride: override } : undefined),
    onSuccess: () => {
      setActionError(null);
      setActionSuccess('Approved for disbursement. The repayment schedule is now active.');
      setShowDisburse(false);
      setPrincipalOverride('');
      invalidate();
    },
    onError: (err) => setActionError(toUserMessage(err)),
  });

  const payMutation = useMutation({
    mutationFn: (repaymentId: string) => markRepaymentPaid(repaymentId),
    onSuccess: () => {
      setActionError(null);
      setActionSuccess('Repayment recorded.');
      invalidate();
    },
    onError: (err) => setActionError(toUserMessage(err)),
  });

  if (detail.isLoading) {
    return (
      <>
        <PageHeader
          title="Loading loan…"
          breadcrumbs={[{ label: 'Active Loans', href: '/loans' }, { label: loanId }]}
        />
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  if (detail.isError) {
    const err = detail.error;
    const isNotFound = err instanceof ApiError && err.status === 404;
    return (
      <>
        <PageHeader
          title="Loan"
          breadcrumbs={[{ label: 'Active Loans', href: '/loans' }, { label: loanId }]}
        />
        <div className="p-6">
          <AlertBanner
            tone="warning"
            title={isNotFound ? 'This loan is no longer available' : 'Couldn’t load this loan'}
            description={
              isNotFound
                ? 'It may have been removed or you don’t have access.'
                : toUserMessage(err)
            }
            action={
              <Link href="/loans">
                <Button size="sm" variant="secondary">
                  Back to loans
                </Button>
              </Link>
            }
          />
        </div>
      </>
    );
  }

  const loan = detail.data;
  if (!loan) return null;
  return (
    <>
      <PageHeader
        title={`Loan ${loan.id}`}
        breadcrumbs={[
          { label: 'Active Loans', href: '/loans' },
          { label: loan.id },
        ]}
        actions={
          canMutate && canDisburse(loan.status) ? (
            <Button onClick={() => setShowDisburse(true)}>Disburse</Button>
          ) : null
        }
      />

      {actionError ? (
        <div className="px-6 pt-4">
          <AlertBanner
            tone="danger"
            title="Action failed"
            description={actionError}
            onDismiss={() => setActionError(null)}
          />
        </div>
      ) : null}
      {actionSuccess ? (
        <div className="px-6 pt-4">
          <AlertBanner
            tone="success"
            title="Done"
            description={actionSuccess}
            onDismiss={() => setActionSuccess(null)}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <LoanSummaryCard loan={loan} />
          <RepaymentScheduleCard
            loan={loan}
            canMutate={canMutate}
            payingId={payMutation.isPending ? payMutation.variables ?? null : null}
            onPay={(repaymentId) => payMutation.mutate(repaymentId)}
          />
        </div>

        <div className="space-y-6">
          <BorrowerCard loan={loan} />
          <RiskCard loan={loan} />
        </div>
      </div>

      <Dialog open={showDisburse} onOpenChange={setShowDisburse}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disburse this loan?</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <p className="text-sm text-neutral-600">
              This marks the loan as <strong>active</strong> and seeds the repayment
              schedule. Real Squad transfer is wired in Phase 5; for now the row updates
              but no money actually moves.
            </p>
            <FormField
              label={`Principal override (default ${formatCurrency(loan.principalNaira)})`}
              hint="Optional. Leave blank to use the approved principal."
            >
              <Input
                type="number"
                min={1000}
                step={1000}
                value={principalOverride}
                onChange={(e) => setPrincipalOverride(e.target.value)}
                placeholder={String(loan.principalNaira)}
              />
            </FormField>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDisburse(false)}>
              Cancel
            </Button>
            <Button
              loading={disburseMutation.isPending}
              onClick={() => {
                const n = Number(principalOverride);
                disburseMutation.mutate(
                  principalOverride && Number.isFinite(n) && n > 0 ? n : undefined,
                );
              }}
            >
              Approve disbursement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LoanSummaryCard({ loan }: { loan: LoanDetailDto }) {
  return (
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
            { label: 'Collected', value: formatCurrency(loan.totalPaidNaira) },
            { label: 'APR', value: formatPercent(loan.apr) },
            { label: 'Term', value: loan.termMonths ? `${loan.termMonths} months` : '—' },
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
            {
              label: 'Approval score',
              value: loan.scoreAtApproval ?? '—',
            },
            {
              label: 'Predicted repayment',
              value:
                loan.predictedRepaymentRate != null
                  ? formatPercent(loan.predictedRepaymentRate)
                  : '—',
            },
            {
              label: 'On-time rate',
              value: formatPercent(loan.onTimeRepaymentRate),
            },
          ]}
        />
        {loan.rejectionReason ? (
          <p className="mt-3 text-xs text-danger-700">
            Rejection reason · {loan.rejectionReason}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}

function RepaymentScheduleCard({
  loan,
  canMutate,
  payingId,
  onPay,
}: {
  loan: LoanDetailDto;
  canMutate: boolean;
  payingId: string | null;
  onPay: (repaymentId: string) => void;
}) {
  const paid = loan.repayments.filter((r) => r.status === 'paid').length;
  const missed = loan.repayments.filter((r) => r.status === 'missed').length;
  const scheduled = loan.repayments.filter((r) => r.status === 'scheduled').length;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Repayment schedule</CardTitle>
          <p className="mt-0.5 text-xs text-neutral-500">
            {paid} paid · {missed} missed · {scheduled} upcoming
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
        {loan.repayments.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">
            No repayment schedule yet. Disburse the loan to seed it.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="py-2 text-left font-medium" style={{ width: 32 }}></th>
                <th className="py-2 text-left font-medium">#</th>
                <th className="py-2 text-left font-medium">Due</th>
                <th className="py-2 text-right font-medium">Amount</th>
                <th className="py-2 text-left font-medium">Paid</th>
                <th className="py-2 text-left font-medium">Status</th>
                {canMutate ? <th className="py-2 text-right font-medium"></th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loan.repayments.map((r, idx) => (
                <RepaymentRow
                  key={r.id}
                  index={idx + 1}
                  r={r}
                  canMutate={canMutate}
                  isPaying={payingId === r.id}
                  onPay={onPay}
                />
              ))}
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  );
}

function RepaymentRow({
  index,
  r,
  canMutate,
  isPaying,
  onPay,
}: {
  index: number;
  r: LoanRepaymentDto;
  canMutate: boolean;
  isPaying: boolean;
  onPay: (id: string) => void;
}) {
  const status = r.status as keyof typeof REPAYMENT_TONE;
  return (
    <tr>
      <td className="py-2.5">
        <StatusDot tone={REPAYMENT_TONE[status]} />
      </td>
      <td className="py-2.5 font-mono text-xs text-neutral-500" data-numeric>
        {String(index).padStart(2, '0')}
      </td>
      <td className="py-2.5 text-neutral-700">
        {r.scheduledFor ? formatShortDate(r.scheduledFor) : '—'}
      </td>
      <td className="py-2.5 text-right font-medium tabular-nums" data-numeric>
        {formatCurrency(r.amountNaira)}
      </td>
      <td className="py-2.5 text-xs text-neutral-500">
        {r.paidAt ? formatShortDate(r.paidAt) : '—'}
      </td>
      <td className="py-2.5">
        <Badge tone={REPAYMENT_TONE[status]} variant="soft">
          {REPAYMENT_LABEL[status]}
        </Badge>
      </td>
      {canMutate ? (
        <td className="py-2.5 text-right">
          {canMarkRepaymentPaid(r.status) ? (
            <Button
              size="sm"
              variant="ghost"
              loading={isPaying}
              onClick={() => onPay(r.id)}
            >
              Mark paid
            </Button>
          ) : null}
        </td>
      ) : null}
    </tr>
  );
}

function BorrowerCard({ loan }: { loan: LoanDetailDto }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Borrower</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar
            name={loan.borrower.displayName}
            src={loan.borrower.photoUrl ?? undefined}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {loan.borrower.displayName}
            </p>
            <p className="truncate text-xs text-neutral-500">
              <Badge variant="soft" className="mr-1">
                {loan.borrowerType === 'worker' ? 'Worker' : 'Business'}
              </Badge>
              Score {loan.borrower.score}
            </p>
          </div>
          <RadialProgress value={loan.borrower.score} size={48} strokeWidth={5} />
        </div>
        <Link href={`/borrowers/${loan.borrowerType}/${loan.borrower.id}`}>
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
  );
}

function RiskCard({ loan }: { loan: LoanDetailDto }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk</CardTitle>
        <Badge tone={RISK_TONE[loan.riskLevel]}>{RISK_LABEL[loan.riskLevel]}</Badge>
      </CardHeader>
      <CardBody className="space-y-3 text-sm">
        {loan.riskLevel === 'green' ? (
          <p className="text-neutral-600">
            Borrower is paying on schedule. No flags raised.
          </p>
        ) : loan.riskLevel === 'yellow' ? (
          <p className="text-warning-700">
            Slowing repayment pattern. Consider outreach before the next due date.
          </p>
        ) : (
          <p className="text-danger-700">
            Critical — repayments missed or income gone silent. Refer to collections.
          </p>
        )}
        <KeyValueList
          items={[
            { label: 'Approval score', value: loan.scoreAtApproval ?? '—' },
            {
              label: 'Predicted repayment',
              value:
                loan.predictedRepaymentRate != null
                  ? formatPercent(loan.predictedRepaymentRate)
                  : '—',
            },
            {
              label: 'On-time rate',
              value: formatPercent(loan.onTimeRepaymentRate),
            },
          ]}
        />
      </CardBody>
    </Card>
  );
}
