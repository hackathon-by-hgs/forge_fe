import type { components } from '@forge/types/api';
import { api } from './api';

export type SearchResponseDto = components['schemas']['SearchResponseDto'];

export async function fetchDashboardSearch(q: string): Promise<SearchResponseDto> {
  const params = new URLSearchParams({ q });
  return api.get<SearchResponseDto>(`/v1/search?${params.toString()}`);
}
