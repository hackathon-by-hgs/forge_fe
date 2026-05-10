import type { components } from '@forge/types/api';
import { api } from './api';

export type EmployerOverviewDto = components['schemas']['EmployerOverviewDto'];

export async function fetchEmployerOverview(): Promise<EmployerOverviewDto> {
  return api.get<EmployerOverviewDto>('/v1/employer/overview');
}
