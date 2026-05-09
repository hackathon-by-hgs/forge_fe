import type { Bank } from '@forge/types';

export const MOCK_BANKS: readonly Bank[] = [
  {
    id: 'bnk_gtbank',
    name: 'GTBank',
    primaryColor: '#10B981',
    totalActiveLoans: 26,
    totalDisbursedNaira: 18_500_000,
    repaymentRate: 0.94,
    defaultRate: 0.04,
  },
  {
    id: 'bnk_kuda',
    name: 'Kuda',
    primaryColor: '#7C3AED',
    totalActiveLoans: 14,
    totalDisbursedNaira: 6_200_000,
    repaymentRate: 0.91,
    defaultRate: 0.06,
  },
  {
    id: 'bnk_sterling',
    name: 'Sterling',
    primaryColor: '#0EA5E9',
    totalActiveLoans: 9,
    totalDisbursedNaira: 4_800_000,
    repaymentRate: 0.92,
    defaultRate: 0.05,
  },
];
