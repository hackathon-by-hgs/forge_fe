import { z } from 'zod';

export const TransactionStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'reversed',
]);
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

export const TransactionSchema = z.object({
  id: z.string(),
  squadReference: z.string(),
  employerId: z.string(),
  workerId: z.string(),
  jobId: z.string(),
  amountNaira: z.number().int().positive(),
  status: TransactionStatusSchema,
  createdAt: z.string().datetime({ offset: true }),
  settledAt: z.string().datetime({ offset: true }).nullable(),
});
export type Transaction = z.infer<typeof TransactionSchema>;
