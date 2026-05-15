'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertBanner,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  RoutedTabs,
  Skeleton,
} from '@forge/ui';
import { IconExternal, IconStar } from '@forge/ui/icons';
import { formatRelativeTime } from '@forge/ui/utils';
import { workersTabs } from '../../../lib/nav';
import {
  getPendingRatings,
  type PendingRatingItem,
} from '../../../lib/ratingsApi';
import { RatingDialog } from '../../../components/RatingDialog';
import { BulkRatingDialog } from '../../../components/BulkRatingDialog';

/**
 * Inbox for sessions that have settled (employer_confirmed / auto_released /
 * disputed) but are still awaiting the employer's rating. Each row opens
 * the rating dialog; "Rate all" walks through the entire queue end to end.
 *
 * The same backing endpoint (`GET /v1/employer/pending-ratings`) is what
 * unblocks the §27 PENDING_RATINGS_BLOCK_POSTING gate, so clearing the inbox
 * here is equivalent to unblocking job posting.
 */
export default function PendingRatingsPage() {
  const ratingsQuery = useQuery({
    queryKey: ['employer', 'pending-ratings'],
    queryFn: getPendingRatings,
    retry: false,
    // Low-urgency poll — the SSE `rating.created` event auto-invalidates
    // this key the moment a rating lands. Polling is the fallback.
    refetchInterval: 60_000,
  });

  // Two independent dialogs:
  //  - `singleTarget` opens RatingDialog for one worker (per-row Rate button)
  //  - `bulkOpen`     opens BulkRatingDialog (top-bar Rate all button)
  const [singleTarget, setSingleTarget] = useState<PendingRatingItem | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const items = useMemo(() => {
    const data = ratingsQuery.data?.items ?? [];
    return [...data].sort(
      (a, b) =>
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
    );
  }, [ratingsQuery.data]);

  return (
    <>
      <PageHeader
        title="Workers"
        description="Sessions waiting on your rating. You won’t be able to post new jobs until your last few are rated."
        actions={
          items.length > 0 ? (
            <Button
              leadingIcon={<IconStar className="!h-4 !w-4" />}
              onClick={() => setBulkOpen(true)}
            >
              Rate all ({items.length})
            </Button>
          ) : null
        }
      />

      <div className="space-y-4 p-6">
        <RoutedTabs items={workersTabs} />

        {ratingsQuery.isLoading ? (
          <div className="rounded-xl border border-outline bg-surface">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-outline-variant px-4 py-3 last:border-b-0"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
        ) : ratingsQuery.isError ? (
          <AlertBanner
            tone="danger"
            title="Couldn’t load pending ratings"
            description={
              ratingsQuery.error instanceof Error
                ? ratingsQuery.error.message
                : 'Unknown error'
            }
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void ratingsQuery.refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={<IconStar className="!h-6 !w-6" />}
                title="You’re all caught up"
                description="Every settled session has been rated. Ratings build your reputation with workers and unlock new postings."
              />
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Awaiting your rating</CardTitle>
              <Badge tone="warning" variant="soft">
                {items.length}
              </Badge>
            </CardHeader>
            <CardBody className="p-0">
              <ul className="divide-y divide-outline-variant">
                {items.map((it) => (
                  <li
                    key={it.sessionId}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <Avatar
                      name={it.worker.name}
                      src={it.worker.photoUrl ?? undefined}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {it.worker.name}
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        {it.job.title} · completed{' '}
                        {formatRelativeTime(it.completedAt)}
                      </p>
                    </div>
                    <Link
                      href={`/work-sessions/${it.sessionId}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-container-high hover:text-ink"
                      aria-label="Open session"
                    >
                      <IconExternal className="!h-4 !w-4" />
                    </Link>
                    <Button
                      size="sm"
                      leadingIcon={<IconStar className="!h-3.5 !w-3.5" />}
                      onClick={() => setSingleTarget(it)}
                    >
                      Rate
                    </Button>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>

      <RatingDialog
        open={singleTarget !== null}
        sessions={singleTarget ? [singleTarget] : []}
        dismissible
        title="Rate this worker"
        description="Your rating helps other employers find reliable workers."
        onAllRated={() => setSingleTarget(null)}
        onDismiss={() => setSingleTarget(null)}
      />

      <BulkRatingDialog
        open={bulkOpen}
        sessions={items}
        onOpenChange={setBulkOpen}
        onComplete={() => setBulkOpen(false)}
      />
    </>
  );
}
