'use client';

import { useState } from 'react';
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
  Skeleton,
} from '@forge/ui';
import { IconStar, IconStarBorder } from '@forge/ui/icons';
import { formatRelativeTime } from '@forge/ui/utils';
import {
  getBusinessProfile,
  type BusinessProfileDto,
} from '../lib/settingsApi';
import { listReceivedRatings } from '../lib/ratingsApi';

const PAGE_SIZE = 20;

export function ReputationPanel() {
  const [page, setPage] = useState(1);

  // Business profile drives the aggregate header (average + count + top tags
  // where the BE surfaces them). Reused from the existing settings query.
  const profileQuery = useQuery({
    queryKey: ['settings', 'business'],
    queryFn: getBusinessProfile,
  });

  const ratingsQuery = useQuery({
    queryKey: ['employer', 'ratings', { page, pageSize: PAGE_SIZE }],
    queryFn: () => listReceivedRatings({ page, pageSize: PAGE_SIZE }),
  });

  const rows = ratingsQuery.data?.data ?? [];
  const pagination = ratingsQuery.data?.pagination;
  const profileExt = profileQuery.data as ProfileWithRatings | undefined;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your reputation</CardTitle>
        </CardHeader>
        <CardBody>
          {profileQuery.isLoading ? (
            <div className="flex items-center gap-6">
              <Skeleton className="h-16 w-32 rounded-md" />
              <Skeleton className="h-16 flex-1 rounded-md" />
            </div>
          ) : profileQuery.isError ? (
            <AlertBanner
              tone="danger"
              title="Couldn’t load your profile"
              description={
                profileQuery.error instanceof Error
                  ? profileQuery.error.message
                  : 'Unknown error'
              }
            />
          ) : (
            <AggregateHeader profile={profileExt} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ratings received from workers</CardTitle>
          {pagination ? (
            <Badge tone="neutral" variant="soft">
              {pagination.total}
            </Badge>
          ) : null}
        </CardHeader>
        <CardBody className="p-0">
          {ratingsQuery.isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
            </div>
          ) : ratingsQuery.isError ? (
            <div className="p-4">
              <AlertBanner
                tone="danger"
                title="Couldn’t load ratings"
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
            </div>
          ) : rows.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<IconStar className="!h-6 !w-6" />}
                title="No ratings yet"
                description="Workers' ratings show up here once they’re past the 48-hour blind window — or once you’ve rated them back."
              />
            </div>
          ) : (
            <>
              <ul className="divide-y divide-outline-variant">
                {rows.map((r) => (
                  <li key={r.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={r.from.name}
                        src={r.from.photoUrl ?? undefined}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <p className="text-sm font-medium text-ink">
                            {r.from.name}
                          </p>
                          <span className="text-xs text-ink-muted">
                            · {r.job.title}
                          </span>
                          <span className="ml-auto text-[10px] text-ink-muted">
                            {formatRelativeTime(r.submittedAt)}
                          </span>
                        </div>
                        <StarRow stars={r.stars} className="mt-1" />
                        {r.tags.length ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {r.tags.map((t) => (
                              <Badge key={t} tone="neutral" variant="soft">
                                {prettifyTag(t)}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                        {r.comment ? (
                          <p className="mt-2 text-sm text-ink-muted">
                            {r.comment}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {pagination && pagination.totalPages > 1 ? (
                <div className="flex items-center justify-between border-t border-outline-variant px-4 py-3">
                  <span className="text-xs text-ink-muted">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * `rating`, `ratings_count`, and `tags_top` may or may not be present on the
 * profile response — BE has shipped `rating` in the generated types but the
 * other two are mentioned in the §27 brief as expected aggregates. Read
 * dynamically so we don't break if a field hasn't shipped yet.
 */
type ProfileWithRatings = BusinessProfileDto & {
  rating?: number | null;
  ratingsCount?: number | null;
  ratings_count?: number | null;
  tagsTop?: string[] | null;
  tags_top?: string[] | null;
};

function AggregateHeader({ profile }: { profile: ProfileWithRatings | undefined }) {
  const rating =
    profile && typeof profile.rating === 'number' ? profile.rating : null;
  const count =
    profile?.ratingsCount ?? profile?.ratings_count ?? null;
  const topTags = profile?.tagsTop ?? profile?.tags_top ?? null;
  const hasAny = rating != null || (count ?? 0) > 0 || (topTags?.length ?? 0) > 0;

  if (!hasAny) {
    return (
      <p className="text-sm text-ink-muted">
        You don’t have any ratings yet. They show up once workers rate you.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
          Average rating
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span
            className="text-3xl font-semibold text-ink tabular-nums"
            data-numeric
          >
            {rating != null ? rating.toFixed(1) : '—'}
          </span>
          <span className="text-xs text-ink-muted">
            / 5 · {count ?? 0} {count === 1 ? 'rating' : 'ratings'}
          </span>
        </div>
        {rating != null ? (
          <StarRow stars={Math.round(rating)} className="mt-1" />
        ) : null}
      </div>
      {topTags?.length ? (
        <div className="flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
            What workers say
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {topTags.map((t) => (
              <Badge key={t} tone="accent" variant="soft">
                {prettifyTag(t)}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StarRow({ stars, className }: { stars: number; className?: string }) {
  const clamped = Math.max(0, Math.min(5, Math.round(stars)));
  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ''}`}>
      {[1, 2, 3, 4, 5].map((n) =>
        n <= clamped ? (
          <IconStar key={n} className="!h-4 !w-4 text-warning-500" />
        ) : (
          <IconStarBorder key={n} className="!h-4 !w-4 text-neutral-300" />
        ),
      )}
    </span>
  );
}

function prettifyTag(tag: string): string {
  return tag.replace(/_/g, ' ');
}
