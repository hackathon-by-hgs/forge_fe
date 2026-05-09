import { z } from 'zod';

export const LoanStatusSchema = z.enum([
  'draft',
  'pending_review',
  'approved',
  'active',
  'at_risk',
  'repaid',
  'defaulted',
  'rejected',
  'written_off',
]);
export type LoanStatus = z.infer<typeof LoanStatusSchema>;

export const LoanBorrowerTypeSchema = z.enum(['worker', 'business']);
export type LoanBorrowerType = z.infer<typeof LoanBorrowerTypeSchema>;

export const LoanSchema = z.object({
  id: z.string(),
  borrowerId: z.string(),
  borrowerType: LoanBorrowerTypeSchema,
  bankId: z.string(),
  principalNaira: z.number().int().positive(),
  outstandingNaira: z.number().int().nonnegative(),
  apr: z.number().min(0),
  termMonths: z.number().int().positive(),
  status: LoanStatusSchema,
  riskLevel: z.enum(['green', 'yellow', 'red']),
  disbursedAt: z.string().datetime({ offset: true }).nullable(),
  nextPaymentDueAt: z.string().datetime({ offset: true }).nullable(),
  scoreAtApproval: z.number().min(0).max(100),
  predictedRepaymentRate: z.number().min(0).max(1),
});
export type Loan = z.infer<typeof LoanSchema>;

export interface LoanApplication {
  id: string;
  borrowerId: string;
  borrowerType: LoanBorrowerType;
  bankId: string;
  amountRequestedNaira: number;
  appliedAt: string;
  recommendedDecision: 'approve' | 'approve_with_conditions' | 'reject';
  recommendationConfidencePct: number;
  recommendationReason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  scheduledFor: string;
  amountNaira: number;
  paidAt: string | null;
  status: 'scheduled' | 'paid' | 'missed';
}
