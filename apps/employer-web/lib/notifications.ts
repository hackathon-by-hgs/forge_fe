import { formatISO, subMinutes, subHours } from 'date-fns';

export type NotificationKind =
  | 'application'
  | 'worker_late'
  | 'job_completed'
  | 'payment_processed'
  | 'credit_update';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  href?: string;
  occurredAt: string;
  unread: boolean;
}

/**
 * Mock notification feed. Real notifications will come from the API client
 * once auth + a notifications service exist.
 */
export function getMockNotifications(): AppNotification[] {
  const now = new Date();
  return [
    {
      id: 'n1',
      kind: 'worker_late',
      title: 'Worker running late',
      detail: 'Tunde Bello hasn’t clocked in for the Apapa loading job.',
      href: '/workers/active',
      occurredAt: formatISO(subMinutes(now, 4)),
      unread: true,
    },
    {
      id: 'n2',
      kind: 'application',
      title: '7 new applications',
      detail: 'Container loaders, Apapa terminal — review now.',
      href: '/jobs/active',
      occurredAt: formatISO(subMinutes(now, 18)),
      unread: true,
    },
    {
      id: 'n3',
      kind: 'job_completed',
      title: 'Job completed',
      detail: 'Chinwe Okafor finished the discharge crew job.',
      href: '/jobs/active',
      occurredAt: formatISO(subHours(now, 1)),
      unread: true,
    },
    {
      id: 'n4',
      kind: 'payment_processed',
      title: 'Payout processed',
      detail: '₦47,500 settled to Squad wallet.',
      href: '/payments/transactions',
      occurredAt: formatISO(subHours(now, 3)),
      unread: false,
    },
    {
      id: 'n5',
      kind: 'credit_update',
      title: 'Credit score up 6 points',
      detail: 'Your business credit score is now 78 — new loan tier unlocked.',
      href: '/credit',
      occurredAt: formatISO(subHours(now, 22)),
      unread: false,
    },
  ];
}
