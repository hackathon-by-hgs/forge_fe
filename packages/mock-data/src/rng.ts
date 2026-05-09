/**
 * Deterministic seeded pseudo-RNG. Same seed → same data, every reload.
 * Mulberry32 — fast, fine for mock generation, NOT for crypto.
 */
export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('pick: empty array');
  const idx = Math.floor(rng() * arr.length);
  // arr.length > 0 verified above; idx is in [0, arr.length)
  return arr[idx] as T;
}

export function range(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function rangeFloat(rng: () => number, min: number, max: number): number {
  return rng() * (max - min) + min;
}
