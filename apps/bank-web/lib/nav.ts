import type { SidebarSection } from '@forge/ui';
import {
  IconRiskRadar,
  IconApplications,
  IconLoans,
  IconPortfolio,
  IconBorrowers,
  IconSandbox,
  IconAttribution,
  IconReports,
  IconSettings,
} from '@forge/ui/icons';

export const bankNav: SidebarSection[] = [
  {
    items: [{ label: 'Risk Radar', href: '/', icon: IconRiskRadar }],
  },
  {
    label: 'Lending',
    items: [
      { label: 'Loan Applications', href: '/applications', icon: IconApplications },
      { label: 'Active Loans', href: '/loans', icon: IconLoans },
      { label: 'Portfolio', href: '/portfolio', icon: IconPortfolio },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Borrowers', href: '/borrowers/workers', icon: IconBorrowers },
    ],
  },
  {
    label: 'Decision support',
    items: [
      { label: 'Underwriting Sandbox', href: '/sandbox', icon: IconSandbox },
      { label: 'Performance Attribution', href: '/performance', icon: IconAttribution },
      { label: 'Reports', href: '/reports', icon: IconReports },
    ],
  },
  {
    items: [{ label: 'Settings', href: '/settings', icon: IconSettings }],
  },
];
