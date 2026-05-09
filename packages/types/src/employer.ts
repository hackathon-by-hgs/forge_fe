import { z } from 'zod';
import { GeoPointSchema } from './common';

export const EmployerTypeSchema = z.enum(['wholesaler', 'factory', 'retailer', 'logistics']);
export type EmployerType = z.infer<typeof EmployerTypeSchema>;

export const EmployerSchema = z.object({
  id: z.string(),
  businessName: z.string(),
  type: EmployerTypeSchema,
  registeredLocation: GeoPointSchema,
  joinedAt: z.string().datetime({ offset: true }),
  creditScore: z.number().min(0).max(100),
  totalLaborSpendNaira: z.number().int().nonnegative(),
  workersHired: z.number().int().nonnegative(),
  jobsPosted: z.number().int().nonnegative(),
  paymentTimelinessRate: z.number().min(0).max(1),
});
export type Employer = z.infer<typeof EmployerSchema>;
