'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@forge/ui';
import { IconStar, IconStarBorder } from '@forge/ui/icons';
import { useAuth } from '../lib/auth';
import {
  EMPLOYER_RATING_TAGS,
  EMPLOYER_RATING_TAG_LABEL,
  submitRating,
  type EmployerRatingTag,
  type PendingRatingItem,
} from '../lib/ratingsApi';
import { toastApiError, toastSuccess } from '../lib/toast';
import { ApiError } from '../lib/api';

interface RatingDialogProps {
  open: boolean;
  /** Sessions queued to rate. The dialog walks through them one at a time. */
  sessions: PendingRatingItem[];
  /**
   * Controls whether the user can dismiss the dialog. The job-posting gate
   * passes `true` (per brief: "Allow the user to dismiss the modal — they
   * just can't post until they come back and clear it").
   */
  dismissible?: boolean;
  /** Title override — e.g. "Rate before posting". Default: "Rate your worker". */
  title?: string;
  /** Subtitle copy under the title. */
  description?: string;
  /** Called after every successful submit, with the sessionId just rated. */
  onRated?: (sessionId: string) => void;
  /** Called when the queue is empty (every session rated). */
  onAllRated?: () => void;
  /** Called when the user dismisses the dialog. */
  onDismiss?: () => void;
}

/**
 * One-at-a-time rating modal. Drives a queue of `PendingRatingItem` and
 * collapses each into a stars + tags + comment card. After every successful
 * submit, the rated session is popped optimistically and the next one
 * surfaces; when the queue empties, `onAllRated` fires.
 *
 * Idempotency: the submit call generates a stable `rating:{session}:{employer}`
 * key so re-clicks under a flaky network collapse to one row server-side.
 */
export function RatingDialog({
  open,
  sessions,
  dismissible = true,
  title = 'Rate your worker',
  description,
  onRated,
  onAllRated,
  onDismiss,
}: RatingDialogProps) {
  const queryClient = useQueryClient();
  const employerId = useAuth(
    (s) => (s.user?.employerId as string | null | undefined) ?? null,
  );

  // Derive the queue synchronously from props minus the rated set. Mirroring
  // sessions into `useState` had a race: the dialog's open-effect ran before
  // the sessions-effect applied, saw queue.length === 0, and fired
  // onAllRated immediately on open — making the dialog flash open and shut
  // for the first-clicked Rate button.
  const [ratedIds, setRatedIds] = useState<Set<string>>(() => new Set());
  // Reset the rated-set every time the dialog reopens, so prior cycles
  // don't suppress queue items from a fresh batch.
  useEffect(() => {
    if (open) setRatedIds(new Set());
  }, [open]);

  const queue = useMemo<PendingRatingItem[]>(
    () => sessions.filter((s) => !ratedIds.has(s.sessionId)),
    [sessions, ratedIds],
  );

  const current = queue[0] ?? null;

  // Per-session draft state. Reset every time `current` flips so the next
  // card starts blank, not with the previous worker's stars/tags.
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [tags, setTags] = useState<EmployerRatingTag[]>([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    setStars(0);
    setHoverStars(0);
    setTags([]);
    setComment('');
  }, [current?.sessionId]);

  // Fire `onAllRated` only when the user has actually rated ≥ 1 session in
  // this open cycle AND the queue is now empty. `ratedIds.size > 0` is the
  // gate — without it, an initial open with empty sessions or before sync
  // would fire onAllRated and close the dialog instantly.
  const [allRatedFired, setAllRatedFired] = useState(false);
  useEffect(() => {
    if (!open) {
      setAllRatedFired(false);
      return;
    }
    if (ratedIds.size > 0 && queue.length === 0 && !allRatedFired) {
      setAllRatedFired(true);
      onAllRated?.();
    }
  }, [queue.length, ratedIds.size, open, allRatedFired, onAllRated]);

  const submit = useMutation({
    mutationFn: async () => {
      if (!current) throw new Error('No session to rate');
      if (!employerId) {
        throw new ApiError({
          status: 400,
          code: 'EMPLOYER_REQUIRED',
          message: 'No employer context — please reload.',
        });
      }
      return submitRating(current.sessionId, employerId, {
        stars,
        tags: tags.length ? tags : undefined,
        comment: comment.trim() ? comment.trim() : undefined,
      });
    },
    onSuccess: (_resp) => {
      const ratedId = current?.sessionId;
      const ratedName = current?.worker.name;
      const submittedStars = stars;
      if (ratedId) {
        // Optimistic pop via ratedIds. queue is derived, so this is
        // synchronous — the next session surfaces in the very next render.
        setRatedIds((prev) => {
          const next = new Set(prev);
          next.add(ratedId);
          return next;
        });
        onRated?.(ratedId);
      }
      void queryClient.invalidateQueries({ queryKey: ['employer', 'pending-ratings'] });
      void queryClient.invalidateQueries({ queryKey: ['employer', 'ratings'] });
      toastSuccess(
        ratedName ? `Rated ${ratedName}` : 'Rating submitted',
        {
          description: `${submittedStars} star${submittedStars === 1 ? '' : 's'} sent to the worker.`,
        },
      );
    },
    onError: (err) => {
      // UNKNOWN_TAG (422) means our vocabulary drifted from the BE — surface
      // the BE's allowed-set in the toast so the user (and us) notice.
      if (err instanceof ApiError && err.code === 'UNKNOWN_TAG') {
        const allowed = (err.details?.allowed as string[] | undefined) ?? [];
        toastApiError(err, 'One of those tags isn’t accepted');
        if (allowed.length) {
          // eslint-disable-next-line no-console
          console.warn('[ratings] BE rejected tag; allowed set:', allowed);
        }
        return;
      }
      toastApiError(err, 'Couldn’t submit the rating');
    },
  });

  const remaining = queue.length;
  const canSubmit = stars >= 1 && stars <= 5 && !submit.isPending;
  const charsLeft = 280 - comment.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && dismissible) onDismiss?.();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
          {remaining > 0 ? (
            <Badge tone="info" variant="soft" className="mt-2 w-fit">
              {remaining} to rate
            </Badge>
          ) : null}
        </DialogHeader>

        {current ? (
          <DialogBody className="space-y-5">
            <div className="flex items-center gap-3 rounded-md border border-outline-variant bg-surface p-3">
              <Avatar
                name={current.worker.name}
                src={current.worker.photoUrl ?? undefined}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {current.worker.name}
                </p>
                <p className="truncate text-xs text-ink-muted">{current.job.title}</p>
              </div>
            </div>

            <StarPicker
              value={stars}
              hover={hoverStars}
              onChange={setStars}
              onHover={setHoverStars}
            />

            <div>
              <p className="mb-2 text-xs font-medium text-ink-muted">
                What stood out? (optional)
              </p>
              <TagChips value={tags} onChange={setTags} />
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-ink-muted">
                Comment (optional)
              </p>
              <Textarea
                rows={3}
                maxLength={280}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Anything else worth flagging for the next employer?"
              />
              <p className="mt-1 text-right text-[10px] text-ink-muted tabular-nums">
                {charsLeft}
              </p>
            </div>
          </DialogBody>
        ) : (
          <DialogBody>
            <p className="text-sm text-ink-muted">
              You’re all caught up — every pending session has been rated.
            </p>
          </DialogBody>
        )}

        <DialogFooter>
          {dismissible ? (
            <Button
              variant="secondary"
              onClick={() => onDismiss?.()}
              disabled={submit.isPending}
            >
              {current ? 'Do this later' : 'Close'}
            </Button>
          ) : null}
          {current ? (
            <Button
              loading={submit.isPending}
              disabled={!canSubmit}
              onClick={() => submit.mutate()}
            >
              Submit rating
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StarPicker({
  value,
  hover,
  onChange,
  onHover,
}: {
  value: number;
  hover: number;
  onChange: (n: number) => void;
  onHover: (n: number) => void;
}) {
  const active = hover || value;
  const helper = useMemo(
    () =>
      active === 0
        ? 'Tap to rate'
        : active === 1
          ? 'Bad — would not rehire'
          : active === 2
            ? 'Below expectations'
            : active === 3
              ? 'Okay — met expectations'
              : active === 4
                ? 'Great — would consider rehiring'
                : 'Outstanding — would absolutely rehire',
    [active],
  );
  return (
    <div onMouseLeave={() => onHover(0)} className="text-center">
      <div className="inline-flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= active;
          return (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              onMouseEnter={() => onHover(n)}
              onFocus={() => onHover(n)}
              onBlur={() => onHover(0)}
              onClick={() => onChange(n)}
              className="rounded p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              {filled ? (
                <IconStar className="!h-8 !w-8 text-warning-500" />
              ) : (
                <IconStarBorder className="!h-8 !w-8 text-neutral-300" />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-ink-muted">{helper}</p>
    </div>
  );
}

function TagChips({
  value,
  onChange,
}: {
  value: EmployerRatingTag[];
  onChange: (next: EmployerRatingTag[]) => void;
}) {
  const toggle = (tag: EmployerRatingTag) => {
    onChange(
      value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag],
    );
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {EMPLOYER_RATING_TAGS.map((tag) => {
        const on = value.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={
              on
                ? 'rounded-full border border-accent-500 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700 transition-colors'
                : 'rounded-full border border-outline-variant bg-surface px-3 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-container'
            }
            aria-pressed={on}
          >
            {EMPLOYER_RATING_TAG_LABEL[tag]}
          </button>
        );
      })}
    </div>
  );
}
