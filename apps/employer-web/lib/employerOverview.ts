import { api } from './api';
import { EmployerOverviewSchema, type EmployerOverview } from './employerOverview.schema';

export async function fetchEmployerOverview(): Promise<EmployerOverview> {
  const raw: unknown = await api.get<unknown>('/v1/employer/overview');
  return EmployerOverviewSchema.parse(raw);
}
