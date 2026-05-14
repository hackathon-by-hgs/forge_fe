import type { RoutedTab, SidebarSection } from '@forge/ui';
import {
  IconDashboard,
  IconBriefcase,
  IconWorkers,
  IconPayments,
  IconAnalytics,
  IconCredit,
  IconSettings,
  IconShield,
} from '@forge/ui/icons';

export const employerNav: SidebarSection[] = [
  {
    items: [{ label: 'Overview', href: '/', icon: IconDashboard }],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Jobs', href: '/jobs', icon: IconBriefcase },
      { label: 'Workers', href: '/workers', icon: IconWorkers },
      { label: 'Review queue', href: '/work-sessions', icon: IconShield },
      { label: 'Payments', href: '/payments', icon: IconPayments },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics', href: '/analytics', icon: IconAnalytics },
      { label: 'Credit & Loans', href: '/credit', icon: IconCredit },
    ],
  },
  {
    items: [{ label: 'Settings', href: '/settings', icon: IconSettings }],
  },
];

export const jobsTabs: RoutedTab[] = [
  { label: 'All', href: '/jobs', exact: true },
  { label: 'Active', href: '/jobs/active' },
  { label: 'Drafts', href: '/jobs/drafts' },
  { label: 'History', href: '/jobs/history' },
];

export const workersTabs: RoutedTab[] = [
  { label: 'Currently working', href: '/workers/active', exact: true },
  { label: 'My team', href: '/workers/team', exact: true },
  { label: 'Pending ratings', href: '/workers/pending-ratings', exact: true },
  { label: 'Browse talent', href: '/workers/browse', exact: true },
];

export const paymentsTabs: RoutedTab[] = [
  /** No `exact` — keep active on `/payments/transactions/:id` deep links. */
  { label: 'Transactions', href: '/payments/transactions' },
  { label: 'Invoices', href: '/payments/invoices', exact: true },
  { label: 'Payouts', href: '/payments/payouts', exact: true },
];
