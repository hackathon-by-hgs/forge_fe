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
import { toastApiError, toastError, toastSuccess } from '../lib/toast';
import { ApiError } from '../lib/api';

interface BulkRatingDialogProps {
  open: boolean;
  sessions: PendingRatingItem[];
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

/**
 * "Rate all" — apply the same stars / tags / comment to every pending
 * session in one submit cycle. Distinct from `RatingDialog`, which walks
 * sessions one at a time; this dialog fans out N parallel POSTs via
 * Promise.allSettled and reports an aggregate result.
 *
 * Failure handling: if any submit 422s or 5xx's, the dialog stays open so
 * the user can retry. Successfully-rated sessions get popped from the
 * internal list so retries only target the remainder.
 */
export function BulkRatingDialog({
  open,
  sessions,
  onOpenChange,
  onComplete,
}: BulkRatingDialogProps) {
  const queryClient = useQueryClient();
  const employerId = useAuth(
    (s) => (s.user?.employerId as string | null | undefined) ?? null,
  );

  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [tags, setTags] = useState<EmployerRatingTag[]>([]);
  const [comment, setComment] = useState('');
  const [ratedIds, setRatedIds] = useState<Set<string>>(() => new Set());
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set());

  // Reset state every time the dialog reopens.
  useEffect(() => {
    if (open) {
      setStars(0);
      setHoverStars(0);
      setTags([]);
      setComment('');
      setRatedIds(new Set());
      setFailedIds(new Set());
    }
  }, [open]);

  const remaining = useMemo<PendingRatingItem[]>(
    () => sessions.filter((s) => !ratedIds.has(s.sessionId)),
    [sessions, ratedIds],
  );

  const submit = useMutation({
    mutationFn: async () => {
      if (!employerId) {
        throw new ApiError({
          status: 400,
          code: 'EMPLOYER_REQUIRED',
          message: 'No employer context — please reload.',
        });
      }
      if (remaining.length === 0) {
        return { succeededIds: [] as string[], failures: [] as Array<{ id: string; err: unknown }> };
      }
      const body = {
        stars,
        tags: tags.length ? tags : undefined,
        comment: comment.trim() ? comment.trim() : undefined,
      };
      // Fan out N parallel submits. allSettled so a single 422 doesn't
      // abort the rest — the user gets partial credit for the ones that
      // succeeded and can retry the failures.
      const results = await Promise.allSettled(
        remaining.map((s) =>
          submitRating(s.sessionId, employerId, body).then(() => s.sessionId),
        ),
      );
      const succeededIds: string[] = [];
      const failures: Array<{ id: string; err: unknown }> = [];
      results.forEach((r, idx) => {
        const sessionId = remaining[idx]?.sessionId;
        if (!sessionId) return;
        if (r.status === 'fulfilled') succeededIds.push(sessionId);
        else failures.push({ id: sessionId, err: r.reason });
      });
      return { succeededIds, failures };
    },
    onSuccess: ({ succeededIds, failures }) => {
      if (succeededIds.length > 0) {
        setRatedIds((prev) => {
          const next = new Set(prev);
          for (const id of succeededIds) next.add(id);
          return next;
        });
      }
      setFailedIds(new Set(failures.map((f) => f.id)));

      void queryClient.invalidateQueries({ queryKey: ['employer', 'pending-ratings'] });
      void queryClient.invalidateQueries({ queryKey: ['employer', 'ratings'] });

      if (succeededIds.length > 0) {
        toastSuccess(
          `Rated ${succeededIds.length} ${succeededIds.length === 1 ? 'worker' : 'workers'}`,
          {
            description: `${stars} star${stars === 1 ? '' : 's'} sent to ${succeededIds.length === 1 ? 'the worker' : 'each one'}.`,
          },
        );
      }
      if (failures.length > 0) {
        // If everything failed, surface the first error in friendly form.
        const first = failures[0]?.err;
        if (first instanceof ApiError && first.code === 'UNKNOWN_TAG') {
          const allowed = (first.details?.allowed as string[] | undefined) ?? [];
          toastApiError(first, 'One of those tags isn’t accepted');
          if (allowed.length) {
            // eslint-disable-next-line no-console
            console.warn('[ratings] BE rejected tag; allowed set:', allowed);
          }
        } else {
          toastError(
            `${failures.length} rating${failures.length === 1 ? '' : 's'} failed`,
            { description: 'Tap Submit again to retry the ones that didn’t go through.' },
          );
        }
        return;
      }
      // Everything succeeded — close the dialog.
      onComplete?.();
      onOpenChange(false);
    },
    onError: (err) => {
      toastApiError(err, 'Couldn’t submit ratings');
    },
  });

  const canSubmit =
    stars >= 1 &&
    stars <= 5 &&
    !submit.isPending &&
    remaining.length > 0;
  const charsLeft = 280 - comment.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Rate all{' '}
            {remaining.length > 0
              ? `${remaining.length} ${remaining.length === 1 ? 'worker' : 'workers'}`
              : 'workers'}
          </DialogTitle>
          <DialogDescription>
            The same rating will apply to everyone below. You can rate them
            individually later if you’d rather customise.
          </DialogDescription>
          {failedIds.size > 0 ? (
            <Badge tone="warning" variant="soft" className="mt-2 w-fit">
              {failedIds.size} retry pending
            </Badge>
          ) : null}
        </DialogHeader>

        <DialogBody className="space-y-5">
          {remaining.length === 0 ? (
            <p className="rounded-md border border-outline-variant bg-surface p-3 text-sm text-ink-muted">
              Everyone in this batch has been rated.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-outline-variant bg-surface p-3">
              {remaining.slice(0, 10).map((s) => (
                <span
                  key={s.sessionId}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2 py-1"
                  title={`${s.worker.name} · ${s.job.title}`}
                >
                  <Avatar
                    name={s.worker.name}
                    src={s.worker.photoUrl ?? undefined}
                    size="sm"
                  />
                  <span className="text-xs font-medium text-ink">
                    {s.worker.name}
                  </span>
                </span>
              ))}
              {remaining.length > 10 ? (
                <span className="text-xs text-ink-muted">
                  + {remaining.length - 10} more
                </span>
              ) : null}
            </div>
          )}

          <StarPicker
            value={stars}
            hover={hoverStars}
            onChange={setStars}
            onHover={setHoverStars}
          />

          <div>
            <p className="mb-2 text-xs font-medium text-ink-muted">
              What stood out? (optional, applies to everyone)
            </p>
            <TagChips value={tags} onChange={setTags} />
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-ink-muted">
              Comment (optional, applies to everyone)
            </p>
            <Textarea
              rows={3}
              maxLength={280}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="One note for the batch — workers see this verbatim."
            />
            <p className="mt-1 text-right text-[10px] text-ink-muted tabular-nums">
              {charsLeft}
            </p>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={submit.isPending}
          >
            Cancel
          </Button>
          <Button
            loading={submit.isPending}
            disabled={!canSubmit}
            onClick={() => submit.mutate()}
          >
            {failedIds.size > 0
              ? `Retry ${remaining.length} rating${remaining.length === 1 ? '' : 's'}`
              : `Submit ${remaining.length} rating${remaining.length === 1 ? '' : 's'}`}
          </Button>
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
        ? 'Tap to rate everyone'
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
