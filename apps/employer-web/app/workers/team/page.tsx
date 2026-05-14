'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  Input,
  MetricTile,
  PageHeader,
  Pagination,
  RadialProgress,
  RoutedTabs,
  Select,
  Skeleton,
} from '@forge/ui';
import { IconAdd, IconClose, IconSearch, IconUser } from '@forge/ui/icons';
import { formatRelativeTime } from '@forge/ui/utils';
import { workersTabs } from '../../../lib/nav';
import {
  fetchTeam,
  removeTeamMember,
  type TeamMemberDto,
  type TeamSortBy,
} from '../../../lib/workersApi';
import { AddWorkerToTeamDialog } from '../../../components/AddWorkerToTeamDialog';
import { toastApiError, toastSuccess } from '../../../lib/toast';

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

export default function MyTeamPage() {
  const [sortBy, setSortBy] = useState<TeamSortBy>('recent');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(24);
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();

  const teamQuery = useQuery({
    queryKey: ['employer', 'workers', 'team', { sortBy, page, pageSize }],
    queryFn: () => fetchTeam({ sortBy, page, pageSize }),
    retry: false,
    placeholderData: (prev) => prev,
  });

  // Memoize so the array reference is stable when the underlying query
  // data hasn't changed — the dependent `useMemo`s below depend on this.
  const members = useMemo(
    () => teamQuery.data?.data ?? [],
    [teamQuery.data],
  );
  const pagination = teamQuery.data?.pagination;

  // In-page search across the loaded page. The BE team endpoint doesn't take
  // a `q` filter, so for now we filter the rendered batch only — bump
  // `pageSize` if more aggressive filtering is needed.
  const filteredMembers = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    if (!trimmed) return members;
    return members.filter(
      (w) =>
        w.fullName.toLowerCase().includes(trimmed) ||
        w.primarySkill.toLowerCase().includes(trimmed) ||
        (w.homeNeighborhood ?? '').toLowerCase().includes(trimmed),
    );
  }, [members, search]);

  const saved = useMemo(
    () => filteredMembers.filter((w) => w.explicitlyAdded),
    [filteredMembers],
  );
  const fromHires = useMemo(
    () => filteredMembers.filter((w) => !w.explicitlyAdded),
    [filteredMembers],
  );

  const totals = useMemo(() => {
    const all = members;
    return {
      total: all.length,
      saved: all.filter((w) => w.explicitlyAdded).length,
      fromHires: all.filter((w) => !w.explicitlyAdded).length,
    };
  }, [members]);

  const removeMutation = useMutation({
    mutationFn: (workerId: string) => removeTeamMember(workerId),
    onMutate: async (workerId) => {
      // Optimistic removal so the card vanishes before the round-trip.
      const key = ['employer', 'workers', 'team', { sortBy, page, pageSize }] as const;
      await queryClient.cancelQueries({ queryKey: ['employer', 'workers', 'team'] });
      const prev = queryClient.getQueryData(key);
      queryClient.setQueryData<{ data: TeamMemberDto[]; pagination: typeof pagination }>(
        key,
        (old) =>
          old
            ? { ...old, data: old.data.filter((w) => w.id !== workerId) }
            : old,
      );
      return { prev, key };
    },
    onError: (err, _workerId, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(ctx.key, ctx.prev);
      toastApiError(err, 'Couldn’t remove worker');
    },
    onSuccess: () => {
      toastSuccess('Removed from team');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['employer', 'workers', 'team'] });
    },
  });

  return (
    <>
      <PageHeader
        title="Your team"
        description="Workers you’ve saved or hired before. They rank higher on team-first jobs."
        actions={
          <Button
            leadingIcon={<IconAdd className="!h-4 !w-4" />}
            onClick={() => setShowAddDialog(true)}
          >
            Add worker
          </Button>
        }
      />

      <div className="space-y-5 p-6">
        <RoutedTabs items={workersTabs} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricTile label="On your team" value={totals.total.toString()} />
          <MetricTile
            label="Saved favorites"
            value={totals.saved.toString()}
            hint="Added directly by you"
          />
          <MetricTile
            label="From past hires"
            value={totals.fromHires.toString()}
            hint="Auto-added after 2+ jobs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Filter by name, skill, or neighborhood…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            className="max-w-sm flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            aria-label="Sort"
            options={[
              { label: 'Most recent', value: 'recent' },
              { label: 'Most hired', value: 'hired' },
              { label: 'Highest rated', value: 'rating' },
            ]}
            className="w-44"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as TeamSortBy)}
          />
        </div>

        {teamQuery.isError ? (
          <AlertBanner
            tone="danger"
            title="Couldn’t load team"
            description={
              teamQuery.error instanceof Error
                ? teamQuery.error.message
                : 'Unknown error'
            }
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void teamQuery.refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : teamQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={<IconUser className="!h-6 !w-6" />}
                title="No team members yet"
                description="Save a worker manually or hire any worker twice — they’ll show up here automatically."
                action={
                  <Button
                    leadingIcon={<IconAdd className="!h-4 !w-4" />}
                    onClick={() => setShowAddDialog(true)}
                  >
                    Add worker
                  </Button>
                }
              />
            </CardBody>
          </Card>
        ) : filteredMembers.length === 0 ? (
          <Card>
            <CardBody className="text-center text-sm text-ink-muted">
              No team members match “{search}”.
            </CardBody>
          </Card>
        ) : (
          <>
            {saved.length > 0 ? (
              <TeamSection
                title="Saved favorites"
                description="Workers you added directly."
                badgeTone="accent"
                members={saved}
                onRemove={(id) => removeMutation.mutate(id)}
                removing={removeMutation.variables}
                removeIsPending={removeMutation.isPending}
              />
            ) : null}
            {fromHires.length > 0 ? (
              <TeamSection
                title="From past hires"
                description="Auto-added after their second job with you."
                badgeTone="neutral"
                members={fromHires}
                onRemove={(id) => removeMutation.mutate(id)}
                removing={removeMutation.variables}
                removeIsPending={removeMutation.isPending}
              />
            ) : null}

            {pagination && pagination.total > pageSize ? (
              <div className="rounded-xl border border-outline bg-surface-container">
                <Pagination
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onPageChange={setPage}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  onPageSizeChange={(ps) => {
                    setPageSize(ps);
                    setPage(1);
                  }}
                  itemLabel="worker"
                  className="border-t-0"
                />
              </div>
            ) : null}
          </>
        )}
      </div>

      <AddWorkerToTeamDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </>
  );
}

function TeamSection({
  title,
  description,
  badgeTone,
  members,
  onRemove,
  removing,
  removeIsPending,
}: {
  title: string;
  description: string;
  badgeTone: 'accent' | 'neutral';
  members: TeamMemberDto[];
  onRemove: (workerId: string) => void;
  removing: string | undefined;
  removeIsPending: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
        </div>
        <Badge tone={badgeTone} variant="soft">
          {members.length}
        </Badge>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((w) => (
            <TeamMemberCard
              key={w.id}
              member={w}
              onRemove={() => onRemove(w.id)}
              isRemoving={removeIsPending && removing === w.id}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function TeamMemberCard({
  member,
  onRemove,
  isRemoving,
}: {
  member: TeamMemberDto;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const scoreTone =
    member.reliabilityScore >= 80
      ? 'success'
      : member.reliabilityScore >= 65
        ? 'warning'
        : 'danger';
  return (
    <div className="group relative flex flex-col gap-3 rounded-lg border border-outline bg-surface p-3 transition-shadow hover:shadow-sm">
      <button
        type="button"
        aria-label={`Remove ${member.fullName} from team`}
        onClick={onRemove}
        disabled={isRemoving}
        className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-muted opacity-0 transition-opacity hover:bg-surface-container-high hover:text-danger-600 focus:opacity-100 group-hover:opacity-100 disabled:opacity-40"
      >
        <IconClose className="!h-3.5 !w-3.5" />
      </button>
      <div className="flex items-center gap-3">
        <Avatar
          name={member.fullName}
          src={member.photoUrl ?? undefined}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/workers/${member.id}`}
            className="block truncate text-sm font-semibold text-ink hover:underline"
          >
            {member.fullName}
          </Link>
          <p className="truncate text-xs text-ink-muted">
            {member.primarySkill} · {member.homeNeighborhood ?? '—'}
          </p>
        </div>
        <RadialProgress value={member.reliabilityScore} size={44} strokeWidth={5} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wider text-ink-muted">
        <div>
          <p className="text-xs font-semibold text-ink tabular-nums" data-numeric>
            {member.jobsWithEmployer}
          </p>
          <p>With you</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-ink tabular-nums" data-numeric>
            {(member.onTimeRate * 100).toFixed(0)}%
          </p>
          <p>On-time</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-ink tabular-nums" data-numeric>
            ★ {member.averageRating.toFixed(1)}
          </p>
          <p>Rating</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Badge tone={scoreTone} variant="soft">
          Score {member.reliabilityScore}
        </Badge>
        {member.lastJobAt ? (
          <span className="text-[10px] text-ink-muted">
            Last hired {formatRelativeTime(member.lastJobAt)}
          </span>
        ) : null}
      </div>
      <Link href="/jobs/new" className="block">
        <Button className="w-full" size="sm">
          Hire again
        </Button>
      </Link>
    </div>
  );
}
