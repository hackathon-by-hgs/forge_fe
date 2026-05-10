import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './errors';

/**
 * One QueryClient per app, per FRONTEND_INTEGRATION.md §2.4.
 *
 * Defaults:
 *   - `staleTime: 30s` — dashboard data is real-time-ish.
 *   - `refetchOnWindowFocus: true`.
 *   - Skip retries on 4xx envelope errors (they won't get better) but
 *     keep them on 5xx / network blips.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
