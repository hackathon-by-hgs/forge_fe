import { request } from './client';
import type { BankRiskRadarDto } from './bankTypes';

/** §5.8 — Risk Radar composite (Phase 4). */
export function fetchRiskRadar(): Promise<BankRiskRadarDto> {
  return request<BankRiskRadarDto>('/v1/bank/risk-radar');
}
