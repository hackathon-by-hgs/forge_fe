import { formatISO, subDays, subHours, subMinutes } from 'date-fns';
import type {
  Loan,
  LoanApplication,
  LoanStatus,
  RiskLevel,
  StatusTone,
} from '@forge/types';
import type {
  DashboardRole,
} from './api/types';
import type {
  RepaymentStatusWire,
} from './api/bankApi';

export const REPAYMENT_TONE: Record<RepaymentStatusWire, StatusTone> = {
  paid: 'success',
  missed: 'danger',
  scheduled: 'neutral',
};

export const REPAYMENT_LABEL: Record<RepaymentStatusWire, string> = {
  paid: 'Paid',
  missed: 'Missed',
  scheduled: 'Scheduled',
};

export function isCreditOfficer(role: DashboardRole | undefined | null): boolean {
  return role === 'bank_credit_officer';
}

export function canDisburse(status: string): boolean {
  return status === 'approved';
}

export function canMarkRepaymentPaid(status: string): boolean {
  return status === 'scheduled' || status === 'missed';
}

export function canDecideApplication(status: string): boolean {
  return status === 'pending';
}

export const STATUS_LABEL: Record<LoanStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending',
  approved: 'Approved',
  active: 'Active',
  at_risk: 'At risk',
  repaid: 'Repaid',
  defaulted: 'Defaulted',
  rejected: 'Rejected',
  written_off: 'Written off',
};

export const STATUS_TONE: Record<LoanStatus, StatusTone> = {
  draft: 'neutral',
  pending_review: 'info',
  approved: 'info',
  active: 'success',
  at_risk: 'warning',
  repaid: 'neutral',
  defaulted: 'danger',
  rejected: 'neutral',
  written_off: 'danger',
};

export const RISK_TONE: Record<RiskLevel, StatusTone> = {
  green: 'success',
  yellow: 'warning',
  red: 'danger',
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  green: 'Healthy',
  yellow: 'Watch',
  red: 'Critical',
};

export type Decision = LoanApplication['recommendedDecision'];

export const DECISION_LABEL: Record<Decision, string> = {
  approve: 'Approve',
  approve_with_conditions: 'Conditions',
  reject: 'Reject',
};

export const DECISION_TONE: Record<Decision, StatusTone> = {
  approve: 'success',
  approve_with_conditions: 'warning',
  reject: 'danger',
};

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  detail?: string;
  occurredAt: string;
  tone: StatusTone;
}

export function getApplicationAudit(app: LoanApplication): AuditEvent[] {
  const now = new Date();
  return [
    {
      id: 'a1',
      actor: 'Forge model · v3.2',
      action: `Recommended ${app.recommendedDecision.replace(/_/g, ' ')}`,
      detail: `Confidence ${app.recommendationConfidencePct}% · ${app.recommendationReason}`,
      occurredAt: formatISO(subMinutes(now, 1)),
      tone: 'info',
    },
    {
      id: 'a2',
      actor: 'System',
      action: 'Application received',
      detail: `Borrower submitted via platform · ref ${app.id}`,
      occurredAt: app.appliedAt,
      tone: 'neutral',
    },
  ];
}

export function getLoanAudit(loan: Loan): AuditEvent[] {
  const now = new Date();
  const events: AuditEvent[] = [];

  if (loan.disbursedAt) {
    events.push({
      id: 'l1',
      actor: 'Squad · disbursement',
      action: 'Funds wired',
      detail: `${loan.principalNaira.toLocaleString('en-NG')} NGN to borrower wallet`,
      occurredAt: loan.disbursedAt,
      tone: 'success',
    });
    events.push({
      id: 'l0',
      actor: 'Chinwe Okafor · Credit Officer',
      action: 'Approved & signed off',
      detail: `Approval score ${loan.scoreAtApproval} · APR ${(loan.apr * 100).toFixed(1)}%`,
      occurredAt: formatISO(subHours(new Date(loan.disbursedAt), 4)),
      tone: 'info',
    });
  }

  if (loan.status === 'at_risk') {
    events.unshift({
      id: 'l2',
      actor: 'Forge model · v3.2',
      action: 'Risk level raised to yellow',
      detail: 'Income trend slowing over past 14 days. Borrower re-flagged for review.',
      occurredAt: formatISO(subDays(now, 2)),
      tone: 'warning',
    });
  }
  if (loan.status === 'defaulted' || loan.status === 'written_off') {
    events.unshift({
      id: 'l3',
      actor: 'Collections',
      action: loan.status === 'written_off' ? 'Loan written off' : 'Marked as defaulted',
      detail: 'Outreach exhausted; matter referred to recovery.',
      occurredAt: formatISO(subDays(now, 1)),
      tone: 'danger',
    });
  }
  if (loan.status === 'repaid') {
    events.unshift({
      id: 'l4',
      actor: 'System',
      action: 'Loan fully repaid',
      detail: 'Final instalment cleared. Closing the file.',
      occurredAt: formatISO(subDays(now, 5)),
      tone: 'success',
    });
  }
  return events;
}
