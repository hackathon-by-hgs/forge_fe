import type { components } from '@forge/types/api';
import { api } from './api';

type EmployerOverviewWire = components['schemas']['EmployerOverviewDto'];
type CashPositionWire = components['schemas']['CashPositionDto'];

/**
 * Squad virtual NUBAN that external depositors can wire NGN to. Issued during
 * employer signup. `null` while the lazy provisioner is still working.
 *
 * Field is added by the Phase 4.5 money loop (FE_MONEY_END_TO_END.md §1) —
 * not yet in the gen'd OpenAPI types, so we overlay it locally and drop the
 * overlay once `pnpm types:gen` picks it up.
 */
export interface VirtualAccount {
  number: string;
  bankCode: string;
  accountName: string;
}

export interface CashPositionDto extends CashPositionWire {
  virtualAccount?: VirtualAccount | null;
}

export interface EmployerOverviewDto extends Omit<EmployerOverviewWire, 'cashPosition'> {
  cashPosition: CashPositionDto;
}

export async function fetchEmployerOverview(): Promise<EmployerOverviewDto> {
  return api.get<EmployerOverviewDto>('/v1/employer/overview');
}
