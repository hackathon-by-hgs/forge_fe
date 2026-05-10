import { MOCK_BANKS, MOCK_LOANS, MOCK_WORKERS } from '@forge/mock-data';
import { request } from './client';
import type {
  BankRiskRadarCriticalItemDto,
  BankRiskRadarDto,
  BankRiskRadarOpportunityDto,
  BankRiskRadarWatchItemDto,
} from './bankTypes';

/**
 * §5.8 — Risk Radar composite.
 *
 * Phase 4 BE endpoint (`GET /v1/bank/risk-radar`) is not yet deployed
 * (confirmed by BE team: ETA ~Phase 3 + 24h). Currently returns 404 in
 * production, so the page sources data from mocks until then.
 *
 * When Phase 4 lands: switch the page's queryFn from `getRiskRadarMock`
 * back to `fetchRiskRadar`, regenerate `api.gen.ts`, and replace the
 * hand-rolled types in `bankTypes.ts` with `components['schemas'][…]`.
 */
export function fetchRiskRadar(): Promise<BankRiskRadarDto> {
  return request<BankRiskRadarDto>('/v1/bank/risk-radar');
}

/** Local stub — computes a Risk Radar payload from `@forge/mock-data`. Drop when Phase 4 ships. */
export async function getRiskRadarMock(): Promise<BankRiskRadarDto> {
  const bank = MOCK_BANKS[0];
  const liveLoans = MOCK_LOANS.filter(
    (l) => l.status === 'active' || l.status === 'at_risk',
  );
  const redLoans = MOCK_LOANS.filter((l) => l.riskLevel === 'red');
  const yellowLoans = MOCK_LOANS.filter((l) => l.riskLevel === 'yellow');

  const criticalAlerts: BankRiskRadarCriticalItemDto[] = redLoans.map((loan) => {
    const w = MOCK_WORKERS.find((wk) => wk.id === loan.borrowerId);
    return {
      loanId: loan.id,
      borrowerName: w?.fullName,
      outstandingNaira: loan.outstandingNaira,
      riskLevel: 'RED',
      headline: 'No income detected for 7+ days. Review payment plan.',
    };
  });

  const watchList: BankRiskRadarWatchItemDto[] = yellowLoans.map((loan) => {
    const w = MOCK_WORKERS.find((wk) => wk.id === loan.borrowerId);
    return {
      loanId: loan.id,
      borrowerName: w?.fullName,
      outstandingNaira: loan.outstandingNaira,
      detail: 'Slowing income trend over past 14 days',
    };
  });

  const opportunity: BankRiskRadarOpportunityDto[] = MOCK_WORKERS.filter(
    (w) => w.eligibility === 'pre_approved',
  )
    .slice(0, 6)
    .map((w) => ({
      id: w.id,
      fullName: w.fullName,
      reliabilityScore: w.reliabilityScore,
      jobsCompleted: w.jobsCompleted,
    }));

  return {
    metrics: {
      activeLoansCount: liveLoans.length,
      activeLoansOutstandingNaira: liveLoans.reduce(
        (s, l) => s + l.outstandingNaira,
        0,
      ),
      totalDisbursedNaira: bank?.totalDisbursedNaira ?? 0,
      repaymentRate: bank?.repaymentRate ?? 0,
      defaultRate: bank?.defaultRate ?? 0,
      activeLoansTrend: [18, 19, 22, 21, 24, 26, liveLoans.length],
      disbursedTrend: [11, 13, 14, 15, 17, 18, 18.5],
      repaymentTrend: [0.91, 0.92, 0.92, 0.93, 0.93, 0.94, 0.94],
      defaultTrend: [0.06, 0.06, 0.05, 0.05, 0.04, 0.04, 0.04],
    },
    criticalAlerts,
    watchList,
    opportunity,
  };
}
