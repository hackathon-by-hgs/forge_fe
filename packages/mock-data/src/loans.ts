import { addMonths, formatISO, subDays } from 'date-fns';
import type {
  Loan,
  LoanApplication,
  LoanBorrowerType,
  LoanRepayment,
  LoanStatus,
  RiskLevel,
} from '@forge/types';
import { MOCK_EMPLOYERS } from './employers';
import { MOCK_WORKERS } from './workers';
import { MOCK_BANKS } from './banks';
import { createRng, pick, range, rangeFloat } from './rng';

const LOAN_STATUS_DIST: readonly LoanStatus[] = [
  'active', 'active', 'active', 'active', 'active', 'active', 'active',
  'at_risk', 'at_risk',
  'repaid', 'repaid',
  'defaulted',
];

function statusToRisk(status: LoanStatus): RiskLevel {
  if (status === 'at_risk') return 'yellow';
  if (status === 'defaulted' || status === 'written_off') return 'red';
  return 'green';
}

export const MOCK_LOANS: readonly Loan[] = (() => {
  const rng = createRng(0xbada55);
  const list: Loan[] = [];
  const bank = MOCK_BANKS[0];
  if (!bank) return list;
  for (let i = 0; i < 40; i += 1) {
    const isWorker = rng() < 0.7;
    const borrowerType: LoanBorrowerType = isWorker ? 'worker' : 'business';
    const borrower = isWorker ? pick(rng, MOCK_WORKERS) : pick(rng, MOCK_EMPLOYERS);
    const principal = isWorker
      ? range(rng, 20_000, 500_000)
      : range(rng, 500_000, 5_000_000);
    const status = pick(rng, LOAN_STATUS_DIST);
    const outstanding =
      status === 'repaid'
        ? 0
        : Math.round(principal * rangeFloat(rng, 0.2, 0.95));
    const disbursed = subDays(new Date(), range(rng, 14, 240));
    list.push({
      id: `loan_${String(i + 1).padStart(4, '0')}`,
      borrowerId: borrower.id,
      borrowerType,
      bankId: bank.id,
      principalNaira: principal,
      outstandingNaira: outstanding,
      apr: rangeFloat(rng, 0.12, 0.22),
      termMonths: pick(rng, [3, 6, 9, 12]),
      status,
      riskLevel: statusToRisk(status),
      disbursedAt: formatISO(disbursed),
      nextPaymentDueAt:
        status === 'active' || status === 'at_risk'
          ? formatISO(addMonths(disbursed, range(rng, 1, 6)))
          : null,
      scoreAtApproval: range(rng, 70, 95),
      predictedRepaymentRate: rangeFloat(rng, 0.85, 0.99),
    });
  }
  return list;
})();

export const MOCK_LOAN_APPLICATIONS: readonly LoanApplication[] = (() => {
  const rng = createRng(0xfade);
  const out: LoanApplication[] = [];
  const bank = MOCK_BANKS[0];
  if (!bank) return out;
  for (let i = 0; i < 30; i += 1) {
    const isWorker = rng() < 0.7;
    const borrower = isWorker ? pick(rng, MOCK_WORKERS) : pick(rng, MOCK_EMPLOYERS);
    const score = isWorker
      ? (borrower as (typeof MOCK_WORKERS)[number]).reliabilityScore
      : (borrower as (typeof MOCK_EMPLOYERS)[number]).creditScore;
    const decision: LoanApplication['recommendedDecision'] =
      score >= 80 ? 'approve' : score >= 65 ? 'approve_with_conditions' : 'reject';
    out.push({
      id: `app_${String(i + 1).padStart(4, '0')}`,
      borrowerId: borrower.id,
      borrowerType: isWorker ? 'worker' : 'business',
      bankId: bank.id,
      amountRequestedNaira: isWorker
        ? range(rng, 25_000, 400_000)
        : range(rng, 500_000, 4_500_000),
      appliedAt: formatISO(subDays(new Date(), range(rng, 0, 14))),
      recommendedDecision: decision,
      recommendationConfidencePct: range(rng, 65, 96),
      recommendationReason:
        decision === 'approve'
          ? 'Strong verified income, on-time history, stable 6-month trend.'
          : decision === 'approve_with_conditions'
            ? 'Acceptable profile with shorter tenure — recommend reduced amount.'
            : 'Insufficient verified income consistency for requested amount.',
      status: 'pending',
    });
  }
  return out;
})();

export function getRepaymentSchedule(loanId: string): LoanRepayment[] {
  const loan = MOCK_LOANS.find((l) => l.id === loanId);
  if (!loan || !loan.disbursedAt) return [];
  const rng = createRng(loanId.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const start = new Date(loan.disbursedAt);
  const installment = Math.round(loan.principalNaira / loan.termMonths);
  return Array.from({ length: loan.termMonths }, (_, i) => {
    const due = addMonths(start, i + 1);
    const isPast = due.getTime() < Date.now();
    const missed = isPast && rng() < (loan.status === 'at_risk' ? 0.4 : 0.05);
    const status: LoanRepayment['status'] = !isPast
      ? 'scheduled'
      : missed
        ? 'missed'
        : 'paid';
    return {
      id: `${loanId}_r${i + 1}`,
      loanId,
      scheduledFor: formatISO(due),
      amountNaira: installment,
      paidAt: status === 'paid' ? formatISO(due) : null,
      status,
    };
  });
}
