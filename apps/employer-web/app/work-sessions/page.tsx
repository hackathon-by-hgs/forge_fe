'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
  Skeleton,
} from '@forge/ui';
import { IconAlert, IconCamera, IconClock, IconShield } from '@forge/ui/icons';
import { formatCurrency } from '@forge/ui/utils';
import {
  canActOnSession,
  isCronTicking,
  listReviewQueue,
  type WorkSessionDto,
} from '../../lib/workSessionsApi';

export default function WorkSessionsQueuePage() {
  const query = useQuery({
    queryKey: ['employer', 'review-queue'],
    queryFn: listReviewQueue,
    retry: false,
  });

  const rows = useMemo(() => {
    const data = query.data?.data ?? [];
    return [...data].sort(
      (a, b) =>
        new Date(a.holdReleaseAt).getTime() - new Date(b.holdReleaseAt).getTime(),
    );
  }, [query.data]);

  return (
    <>
      <PageHeader
        title="Review queue"
        description="Worker clock-outs awaiting your confirmation. Each session auto-releases after 2 hours if you take no action."
      />

      <div className="space-y-4 p-6">
        {query.isLoading ? (
          <div className="rounded-xl border border-outline bg-surface">
            {/* Mirrors the eventual row layout: photo thumb + avatar + name/job + amount column */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-4 border-b border-outline-variant px-4 py-3 last:border-b-0"
              >
                <Skeleton className="h-14 w-14 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="ml-auto h-4 w-20" />
                  <Skeleton className="ml-auto h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {query.isError ? (
          <AlertBanner
            tone="danger"
            title="Couldn’t load the review queue"
            description={
              query.error instanceof Error ? query.error.message : 'Unknown error'
            }
            action={
              <Button size="sm" variant="secondary" onClick={() => void query.refetch()}>
                Retry
              </Button>
            }
          />
        ) : null}

        {!query.isLoading && !query.isError && rows.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={<IconShield className="!h-6 !w-6" />}
                title="No pending reviews"
                description="When a worker clocks out, their payout sits here for 2 hours so you can confirm or dispute it."
              />
            </CardBody>
          </Card>
        ) : null}

        {rows.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Awaiting review</CardTitle>
              <Badge tone="warning">{rows.length}</Badge>
            </CardHeader>
            <CardBody className="p-0">
              <ul className="divide-y divide-outline-variant">
                {rows.map((s) => (
                  <ReviewQueueRow key={s.id} session={s} />
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
}

function ReviewQueueRow({ session }: { session: WorkSessionDto }) {
  return (
    <li>
      <Link
        href={`/work-sessions/${session.id}`}
        className="flex items-start gap-4 px-4 py-3 transition-colors hover:bg-surface-container"
      >
        {session.proofPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.proofPhotoUrl}
            alt="Proof"
            className="h-14 w-14 shrink-0 rounded-md object-cover"
          />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-surface-container-high text-ink-muted">
            <IconCamera className="!h-5 !w-5" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Avatar
              name={session.worker.fullName}
              src={session.worker.photoUrl ?? undefined}
              size="sm"
            />
            <p className="truncate text-sm font-medium text-ink">
              {session.worker.fullName}
            </p>
            {session.clockOut?.verified ? (
              <Badge tone="success" variant="soft">
                GPS ok
              </Badge>
            ) : (
              <Badge tone="warning" variant="soft">
                GPS flagged
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-ink-muted">{session.job.title}</p>
          <CountdownLabel holdReleaseAt={session.holdReleaseAt} session={session} />
        </div>

        <div className="text-right">
          <p
            className="text-sm font-semibold text-ink tabular-nums"
            data-numeric
          >
            {formatCurrency(session.payAmountPendingNaira)}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-muted">
            Pending
          </p>
        </div>
      </Link>
    </li>
  );
}

function CountdownLabel({
  holdReleaseAt,
  session,
}: {
  holdReleaseAt: string;
  session: WorkSessionDto;
}) {
  const remaining = useCountdown(holdReleaseAt);
  if (isCronTicking(session)) {
    return (
      <p className="mt-1 inline-flex items-center gap-1 text-xs text-info-600">
        <IconClock className="!h-3 !w-3" />
        Releasing now…
      </p>
    );
  }
  if (!canActOnSession(session)) {
    return (
      <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-muted">
        <IconClock className="!h-3 !w-3" />
        Window closed
      </p>
    );
  }
  const tone = remaining.totalMs < 10 * 60_000 ? 'text-warning-700' : 'text-ink-muted';
  return (
    <p className={`mt-1 inline-flex items-center gap-1 text-xs ${tone}`}>
      {remaining.totalMs < 10 * 60_000 ? (
        <IconAlert className="!h-3 !w-3" />
      ) : (
        <IconClock className="!h-3 !w-3" />
      )}
      Auto-releases in {remaining.label}
    </p>
  );
}

interface Remaining {
  totalMs: number;
  label: string;
}

/**
 * 1 Hz countdown to `target`. Returns `{ totalMs: 0, label: "0s" }` once
 * elapsed — callers branch on `canActOnSession` / `isCronTicking` for the
 * "Releasing now…" state, not on totalMs alone.
 */
function useCountdown(target: string): Remaining {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const targetMs = new Date(target).getTime();
  const totalMs = Math.max(0, targetMs - now);
  return { totalMs, label: formatDuration(totalMs) };
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}
