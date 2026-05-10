import type { DashboardRole } from '../api/types';

const LABELS: Record<DashboardRole, string> = {
  worker: 'Worker',
  business_owner: 'Business Owner',
  business_admin: 'Business Admin',
  business_hiring_manager: 'Hiring Manager',
  bank_credit_officer: 'Credit Officer',
  bank_risk_analyst: 'Risk Analyst',
  platform_admin: 'Platform Admin',
};

export function roleLabel(role: DashboardRole | undefined | null): string {
  if (!role) return 'Member';
  return LABELS[role] ?? 'Member';
}
