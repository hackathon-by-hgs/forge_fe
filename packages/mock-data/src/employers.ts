import { formatISO, subMonths } from 'date-fns';
import type { Employer, EmployerType, GeoPoint } from '@forge/types';
import {
  BUSINESS_PREFIXES,
  BUSINESS_SUFFIXES,
  NEIGHBORHOODS,
  NEIGHBORHOOD_COORDS,
} from './fixtures';
import { createRng, pick, range, rangeFloat } from './rng';

const TYPES: readonly EmployerType[] = ['wholesaler', 'factory', 'retailer', 'logistics'];

export const MOCK_EMPLOYERS: readonly Employer[] = (() => {
  const rng = createRng(0xface);
  const list: Employer[] = [];
  for (let i = 0; i < 20; i += 1) {
    const neighborhood = pick(rng, NEIGHBORHOODS);
    const coords = NEIGHBORHOOD_COORDS[neighborhood];
    const reg: GeoPoint = {
      lat: coords.lat + rangeFloat(rng, -0.005, 0.005),
      lng: coords.lng + rangeFloat(rng, -0.005, 0.005),
      neighborhood,
    };
    list.push({
      id: `emp_${String(i + 1).padStart(4, '0')}`,
      businessName: `${pick(rng, BUSINESS_PREFIXES)} ${pick(rng, BUSINESS_SUFFIXES)}`,
      type: pick(rng, TYPES),
      registeredLocation: reg,
      joinedAt: formatISO(subMonths(new Date(), range(rng, 2, 22))),
      creditScore: range(rng, 55, 92),
      totalLaborSpendNaira: range(rng, 800_000, 12_000_000),
      workersHired: range(rng, 25, 280),
      jobsPosted: range(rng, 30, 400),
      paymentTimelinessRate: rangeFloat(rng, 0.85, 0.99),
    });
  }
  return list;
})();

export function getEmployerById(id: string): Employer | undefined {
  return MOCK_EMPLOYERS.find((e) => e.id === id);
}
