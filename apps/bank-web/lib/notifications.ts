import { formatISO, subMinutes, subHours } from 'date-fns';

export type NotificationKind =
  | 'application_received'
  | 'loan_at_risk'
  | 'repayment_missed'
  | 'repayment_received'
  | 'borrower_pre_approved'
  | 'disbursement_processed';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  href?: string;
  occurredAt: string;
  unread: boolean;
}

export function getMockNotifications(): AppNotification[] {
  const now = new Date();
  return [
    {
      id: 'n1',
      kind: 'loan_at_risk',
      title: 'Loan flagged red',
      detail: 'loan_0014 — no income detected for 7+ days. Outstanding ₦340k.',
      href: '/',
      occurredAt: formatISO(subMinutes(now, 6)),
      unread: true,
    },
    {
      id: 'n2',
      kind: 'application_received',
      title: '4 new applications',
      detail: 'Two pre-approve, one approve-with-conditions, one referral.',
      href: '/applications',
      occurredAt: formatISO(subMinutes(now, 22)),
      unread: true,
    },
    {
      id: 'n3',
      kind: 'repayment_missed',
      title: 'Repayment missed',
      detail: 'loan_0027 — ₦18,750 instalment missed at 09:00 WAT.',
      href: '/loans',
      occurredAt: formatISO(subMinutes(now, 48)),
      unread: true,
    },
    {
      id: 'n4',
      kind: 'repayment_received',
      title: 'Repayment received',
      detail: 'loan_0019 — ₦52,300 settled via Squad.',
      href: '/loans',
      occurredAt: formatISO(subHours(now, 2)),
      unread: false,
    },
    {
      id: 'n5',
      kind: 'borrower_pre_approved',
      title: '12 new pre-approved borrowers',
      detail: 'Crossed 80-score threshold this week — ready for outreach.',
      href: '/',
      occurredAt: formatISO(subHours(now, 5)),
      unread: false,
    },
    {
      id: 'n6',
      kind: 'disbursement_processed',
      title: 'Disbursement processed',
      detail: 'loan_0032 — ₦2.4M wired to merchant wallet.',
      href: '/loans',
      occurredAt: formatISO(subHours(now, 21)),
      unread: false,
    },
  ];
}
