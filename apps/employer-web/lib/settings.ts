import { z } from 'zod';
import { api } from './api';

export const BusinessSettingsSchema = z
  .object({
    businessName: z.string().optional(),
    name: z.string().optional(),
    type: z.string().optional(),
    primaryContactEmail: z.string().optional(),
    email: z.string().optional(),
    primaryContactPhone: z.string().optional(),
    phone: z.string().optional(),
    registeredAddress: z.string().optional(),
    address: z.string().optional(),
  })
  .passthrough();

export type BusinessSettings = z.infer<typeof BusinessSettingsSchema>;

export const TeamMemberSchema = z
  .object({
    id: z.string().optional(),
    userId: z.string().optional(),
    email: z.string().optional(),
    fullName: z.string().optional(),
    name: z.string().optional(),
    role: z.string(),
  })
  .passthrough();

export const TeamSettingsSchema = z
  .object({
    members: z.array(TeamMemberSchema).optional(),
    items: z.array(TeamMemberSchema).optional(),
    data: z.array(TeamMemberSchema).optional(),
  })
  .passthrough();

export type TeamMember = z.infer<typeof TeamMemberSchema>;

export async function fetchBusinessSettings(): Promise<BusinessSettings> {
  const raw: unknown = await api.get<unknown>('/v1/settings/business');
  const env = z.object({ data: BusinessSettingsSchema }).safeParse(raw);
  if (env.success) return BusinessSettingsSchema.parse(env.data.data);
  return BusinessSettingsSchema.parse(raw);
}

export async function fetchTeamSettings(): Promise<TeamMember[]> {
  const raw: unknown = await api.get<unknown>('/v1/settings/team');
  if (Array.isArray(raw)) return z.array(TeamMemberSchema).parse(raw);
  const parsed = TeamSettingsSchema.parse(raw);
  return parsed.members ?? parsed.items ?? parsed.data ?? [];
}
