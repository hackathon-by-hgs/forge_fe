import { z } from 'zod';
import { api } from './api';

const HitSchema = z
  .object({
    id: z.string(),
    title: z.string().optional(),
    name: z.string().optional(),
    fullName: z.string().optional(),
    href: z.string().optional(),
  })
  .passthrough();

export const DashboardSearchResponseSchema = z
  .object({
    jobs: z.array(HitSchema).optional().default([]),
    workers: z.array(HitSchema).optional().default([]),
    transactions: z.array(HitSchema).optional().default([]),
  })
  .passthrough();

export type DashboardSearchResponse = z.infer<typeof DashboardSearchResponseSchema>;

export async function fetchDashboardSearch(q: string): Promise<DashboardSearchResponse> {
  const params = new URLSearchParams({ q });
  const raw: unknown = await api.get<unknown>(`/v1/search?${params.toString()}`);
  return DashboardSearchResponseSchema.parse(raw);
}
