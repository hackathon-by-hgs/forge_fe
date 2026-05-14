import type { SidebarSection } from '@forge/ui';
import {
  IconRiskRadar,
  IconApplications,
  IconLoans,
  IconPortfolio,
  IconSandbox,
  IconAttribution,
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
  // Borrower profiles are reached via deep-links from Risk Radar opportunities,
  // Loan detail, and Application detail. There is no list endpoint, so we don't
  // surface a sidebar item.
  {
    label: 'Decision support',
    items: [
      { label: 'Underwriting Sandbox', href: '/sandbox', icon: IconSandbox },
      { label: 'Performance Attribution', href: '/performance', icon: IconAttribution },
    ],
  },
];
