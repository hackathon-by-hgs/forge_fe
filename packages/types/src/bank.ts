import { z } from 'zod';

export const BankSchema = z.object({
  id: z.string(),
  name: z.string(),
  primaryColor: z.string(),
  totalActiveLoans: z.number().int().nonnegative(),
  totalDisbursedNaira: z.number().int().nonnegative(),
  repaymentRate: z.number().min(0).max(1),
  defaultRate: z.number().min(0).max(1),
});
export type Bank = z.infer<typeof BankSchema>;
