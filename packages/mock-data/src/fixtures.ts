import type { LagosNeighborhood } from '@forge/types';

export const FIRST_NAMES: readonly string[] = [
  'Adeolu', 'Tunde', 'Chinwe', 'Emeka', 'Aisha', 'Hauwa', 'Ifeoma', 'Bola', 'Yetunde', 'Olumide',
  'Ngozi', 'Kemi', 'Femi', 'Bisi', 'Funmi', 'Dapo', 'Sade', 'Lanre', 'Wale', 'Nkechi',
  'Tobi', 'Seun', 'Chidi', 'Uche', 'Musa', 'Ibrahim', 'Yusuf', 'Folake', 'Tope', 'Bukola',
  'Joshua', 'Mary', 'Ruth', 'David', 'Daniel', 'Esther', 'Grace', 'Samuel', 'Joy', 'Faith',
];

export const LAST_NAMES: readonly string[] = [
  'Adeyemi', 'Okafor', 'Bello', 'Eze', 'Okonkwo', 'Adebayo', 'Ojo', 'Ibrahim', 'Yusuf', 'Aliyu',
  'Olawale', 'Akande', 'Nwosu', 'Onyeka', 'Sanusi', 'Ogun', 'Adesina', 'Igbinedion', 'Babatunde',
  'Okeke', 'Achebe', 'Olusoji', 'Ojuolape', 'Adeniyi', 'Anyanwu', 'Oseni', 'Sulaimon',
];

export const BUSINESS_PREFIXES: readonly string[] = [
  'Apapa', 'Lekki', 'Lagos', 'Trade', 'Market', 'Ocean', 'Rapid', 'Premier', 'Kingpin', 'Greenline',
  'Eko', 'Crown', 'Sunrise', 'Pioneer', 'Continental',
];

export const BUSINESS_SUFFIXES: readonly string[] = [
  'Wholesale', 'Trading Co.', 'Logistics', 'Distribution', 'Industries', 'Foods', 'Mills',
  'Imports', 'Stores', 'Mart', 'Supplies', 'Hub',
];

export const NEIGHBORHOOD_COORDS: Record<LagosNeighborhood, { lat: number; lng: number }> = {
  Apapa: { lat: 6.4458, lng: 3.3608 },
  Lekki: { lat: 6.4474, lng: 3.5006 },
  'Victoria Island': { lat: 6.4281, lng: 3.4216 },
  Ikeja: { lat: 6.6018, lng: 3.3515 },
  'Mile 2': { lat: 6.4581, lng: 3.3199 },
  Surulere: { lat: 6.4983, lng: 3.3614 },
  Yaba: { lat: 6.5075, lng: 3.3787 },
  Ikoyi: { lat: 6.4503, lng: 3.4359 },
  Ajah: { lat: 6.4677, lng: 3.6045 },
  Festac: { lat: 6.4647, lng: 3.2849 },
  Oshodi: { lat: 6.5559, lng: 3.3491 },
};

export const NEIGHBORHOODS: readonly LagosNeighborhood[] = Object.keys(
  NEIGHBORHOOD_COORDS,
) as LagosNeighborhood[];
