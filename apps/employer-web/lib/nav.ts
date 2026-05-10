import type { RoutedTab, SidebarSection } from '@forge/ui';
import {
  IconDashboard,
  IconBriefcase,
  IconWorkers,
  IconPayments,
  IconAnalytics,
  IconCredit,
  IconSettings,
} from '@forge/ui/icons';

const employerNavBase: SidebarSection[] = [
  {
    items: [{ label: 'Overview', href: '/', icon: IconDashboard }],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Jobs', href: '/jobs', icon: IconBriefcase },
      { label: 'Workers', href: '/workers', icon: IconWorkers },
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

export const employerNav: SidebarSection[] = employerNavBase;

export function employerNavForRole(): SidebarSection[] {
  return employerNavBase;
}

export const jobsTabs: RoutedTab[] = [
  { label: 'Active', href: '/jobs/active' },
  { label: 'Drafts', href: '/jobs/drafts' },
  { label: 'History', href: '/jobs/history' },
];

export const workersTabs: RoutedTab[] = [
  { label: 'Currently working', href: '/workers/active' },
  { label: 'My team', href: '/workers/team' },
  { label: 'Browse talent', href: '/workers/browse' },
];

export const paymentsTabs: RoutedTab[] = [
  { label: 'Transactions', href: '/payments/transactions' },
  { label: 'Invoices', href: '/payments/invoices' },
  { label: 'Payouts', href: '/payments/payouts' },
];
