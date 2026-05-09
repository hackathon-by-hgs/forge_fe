import { z } from 'zod';

/**
 * Money is stored as integer Naira (no kobo). Display formatting lives in `@forge/ui/utils`.
 */
export const NairaSchema = z.number().int().nonnegative();
export type Naira = z.infer<typeof NairaSchema>;

export const ISODateSchema = z.string().datetime({ offset: true });
export type ISODate = z.infer<typeof ISODateSchema>;

export const LagosNeighborhoodSchema = z.enum([
  'Apapa',
  'Lekki',
  'Victoria Island',
  'Ikeja',
  'Mile 2',
  'Surulere',
  'Yaba',
  'Ikoyi',
  'Ajah',
  'Festac',
  'Oshodi',
]);
export type LagosNeighborhood = z.infer<typeof LagosNeighborhoodSchema>;

export const GeoPointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  neighborhood: LagosNeighborhoodSchema,
  address: z.string().optional(),
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;

export type RiskLevel = 'green' | 'yellow' | 'red';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type Trend = 'up' | 'down' | 'flat';

export interface Delta {
  value: number;
  direction: Trend;
  pct: number;
}
