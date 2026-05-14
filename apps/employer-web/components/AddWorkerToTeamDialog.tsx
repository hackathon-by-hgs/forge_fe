'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  Input,
  Skeleton,
} from '@forge/ui';
import { IconCheck, IconSearch, IconUser } from '@forge/ui/icons';
import {
  addTeamMember,
  browseWorkers,
  type WorkerSummaryDto,
} from '../lib/workersApi';
import { ApiError } from '../lib/api';
import { toastApiError, toastSuccess } from '../lib/toast';

interface AddWorkerToTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Search-and-save modal. Users type a phone number, name, or worker id; the
 * dialog hits `/v1/employer/workers?q=…` (debounced 250ms) and lets them
 * add any result to their team in one click. Already-saved rows render a
 * "Saved" pill instead of an Add button so users can confirm rather than
 * triggering a 409.
 */
export function AddWorkerToTeamDialog({
  open,
  onOpenChange,
}: AddWorkerToTeamDialogProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Reset state on close so reopening the dialog starts fresh.
  useEffect(() => {
    if (!open) {
      setSearch('');
      setDebouncedSearch('');
      setAddedIds(new Set());
    }
  }, [open]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const browseQuery = useQuery({
    queryKey: ['employer', 'workers', 'browse', { q: debouncedSearch, page: 1, pageSize: 25 }],
    queryFn: () =>
      browseWorkers({
        q: debouncedSearch || undefined,
        page: 1,
        pageSize: 25,
      }),
    enabled: open && debouncedSearch.length >= 2,
    retry: false,
    placeholderData: (prev) => prev,
  });

  const addMutation = useMutation({
    mutationFn: (workerId: string) => addTeamMember(workerId),
    onSuccess: (_data, workerId) => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.add(workerId);
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: ['employer', 'workers', 'team'] });
      void queryClient.invalidateQueries({ queryKey: ['employer', 'workers', 'browse'] });
      toastSuccess('Worker saved to your team', {
        description: 'You can hire them faster on future jobs.',
      });
    },
    onError: (err) => {
      // BE returns 409 when the worker is already on the team — treat as
      // success-shaped (mark the row as added) rather than an error.
      if (err instanceof ApiError && err.status === 409) {
        toastSuccess('Already on your team');
        return;
      }
      toastApiError(err, 'Couldn’t save worker');
    },
  });

  const rows = browseQuery.data?.data ?? [];
  const noQuery = debouncedSearch.length < 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a worker to your team</DialogTitle>
          <DialogDescription>
            Search by phone, name, or worker ID. Saved workers show up at the top
            of your team list and rank higher on team-first jobs.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <Input
            type="search"
            autoFocus
            placeholder="Phone number, name, or worker ID…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="min-h-[200px]">
            {noQuery ? (
              <EmptyHint />
            ) : browseQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full rounded-md" />
                <Skeleton className="h-14 w-full rounded-md" />
                <Skeleton className="h-14 w-full rounded-md" />
              </div>
            ) : browseQuery.isError ? (
              <p className="py-6 text-center text-sm text-danger-600">
                Couldn’t search workers.{' '}
                <button
                  type="button"
                  className="underline"
                  onClick={() => void browseQuery.refetch()}
                >
                  Retry
                </button>
              </p>
            ) : rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">
                No workers match “{debouncedSearch}”.
              </p>
            ) : (
              <ul className="max-h-[360px] divide-y divide-outline-variant overflow-y-auto rounded-md border border-outline-variant">
                {rows.map((w) => (
                  <SearchResultRow
                    key={w.id}
                    worker={w}
                    saved={addedIds.has(w.id)}
                    saving={
                      addMutation.isPending &&
                      addMutation.variables === w.id
                    }
                    onSave={() => addMutation.mutate(w.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SearchResultRow({
  worker,
  saved,
  saving,
  onSave,
}: {
  worker: WorkerSummaryDto;
  saved: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  const scoreTone =
    worker.reliabilityScore >= 80
      ? 'success'
      : worker.reliabilityScore >= 65
        ? 'warning'
        : 'danger';
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <Avatar name={worker.fullName} src={worker.photoUrl ?? undefined} size="md" />
      <div className="min-w-0 flex-1">
        <Link
          href={`/workers/${worker.id}`}
          className="block truncate text-sm font-medium text-ink hover:underline"
        >
          {worker.fullName}
        </Link>
        <p className="truncate text-xs text-ink-muted">
          {worker.primarySkill} ·{' '}
          {worker.homeNeighborhood ?? 'Location unknown'} · ★{' '}
          {worker.averageRating.toFixed(1)}
        </p>
      </div>
      <Badge tone={scoreTone} variant="soft">
        {worker.reliabilityScore}
      </Badge>
      {saved ? (
        <Badge tone="success" variant="soft">
          <IconCheck className="!h-3 !w-3 mr-0.5" />
          Saved
        </Badge>
      ) : (
        <Button size="sm" loading={saving} onClick={onSave}>
          Add
        </Button>
      )}
    </li>
  );
}

function EmptyHint() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-ink-muted">
        <IconUser className="!h-5 !w-5" />
      </span>
      <p className="text-sm font-medium text-ink">Find a worker to save</p>
      <p className="max-w-xs text-xs text-ink-muted">
        Type at least 2 characters — phone numbers, names, or worker IDs all work.
      </p>
    </div>
  );
}
