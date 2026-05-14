'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  DataTable,
  MapPlaceholder,
  PageHeader,
  RoutedTabs,
  Skeleton,
  StatusDot,
  type DataTableColumn,
} from '@forge/ui';
import { IconCamera, IconClock, IconLocation, IconShield } from '@forge/ui/icons';
import { workersTabs } from '../../../lib/nav';
import {
  fetchActiveAssignments,
  type ActiveAssignmentDto,
} from '../../../lib/workersApi';

export default function WorkersActivePage() {
  const router = useRouter();
  const activeQuery = useQuery({
    queryKey: ['employer', 'workers', 'active'],
    queryFn: fetchActiveAssignments,
    refetchInterval: 30_000,
    retry: false,
  });

  const assignments = activeQuery.data?.data ?? [];

  /** Use session id for pin `id` so two workers on the same job do not duplicate React / Maps keys. */
  const pins = assignments.flatMap((a) => {
    if (
      !a.sessionId ||
      !a.job?.id ||
      !Number.isFinite(a.job.lat) ||
      !Number.isFinite(a.job.lng)
    ) {
      return [];
    }
    const overall = a.gpsVerification?.overall;
    return [
      {
        id: a.sessionId,
        jobId: a.job.id,
        lat: a.job.lat,
        lng: a.job.lng,
        tone:
          overall === 'verified'
            ? ('success' as const)
            : overall === 'flagged'
              ? ('danger' as const)
              : ('warning' as const),
      },
    ];
  });

  const columns: DataTableColumn<ActiveAssignmentDto>[] = [
    {
      key: 'name',
      header: 'Worker',
      sortBy: (a) => a.worker.fullName,
      cell: (a) => (
        <div className="flex items-center gap-2">
          <Avatar
            name={a.worker.fullName}
            src={a.worker.photoUrl ?? undefined}
            size="sm"
          />
          <Link
            href={`/workers/${a.worker.id}`}
            className="text-sm font-medium text-neutral-900 hover:underline"
          >
            {a.worker.fullName}
          </Link>
        </div>
      ),
    },
    {
      key: 'job',
      header: 'Job',
      cell: (a) =>
        a.job?.id ? (
          <Link href={`/jobs/${a.job.id}`} className="text-sm hover:underline">
            {a.job.title ?? 'Untitled job'}
          </Link>
        ) : (
          <span className="text-xs text-neutral-500">—</span>
        ),
    },
    {
      key: 'started',
      header: 'Elapsed',
      sortBy: (a) => a.elapsedMinutes,
      cell: (a) => (
        <span
          className="inline-flex items-center gap-1 text-xs text-neutral-700 tabular-nums"
          data-numeric
        >
          <IconClock className="!h-3 !w-3" />
          {a.elapsedMinutes}m
        </span>
      ),
    },
    {
      key: 'gps',
      header: 'GPS',
      cell: (a) => {
        const overall = a.gpsVerification?.overall ?? 'pending';
        const tone =
          overall === 'verified' ? 'success' : overall === 'flagged' ? 'danger' : 'warning';
        return (
          <Badge tone={tone} variant="soft">
            <IconShield className="!h-3 !w-3" /> {overall}
          </Badge>
        );
      },
    },
    {
      key: 'photo',
      header: 'Photo proof',
      cell: (a) =>
        a.hasPhotoProof ? (
          <Badge tone="success" variant="soft">
            <IconCamera className="!h-3 !w-3" /> Uploaded
          </Badge>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
            <IconCamera className="!h-3.5 !w-3.5" /> Pending
          </span>
        ),
    },
    {
      key: 'distance',
      header: 'Last GPS',
      cell: (a) =>
        a.gpsVerification?.lastEventDistanceMeters != null ? (
          <span className="text-xs text-neutral-500 tabular-nums" data-numeric>
            {a.gpsVerification.lastEventDistanceMeters}m
          </span>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Workers"
        description="Live view of every worker on the clock right now."
      />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <RoutedTabs items={workersTabs} />
          <Badge tone="success" variant="soft">
            <StatusDot tone="success" pulse /> {assignments.length} active
          </Badge>
        </div>

        {activeQuery.isError ? (
          <AlertBanner
            tone="danger"
            title="Couldn’t load active workers"
            description={
              activeQuery.error instanceof Error
                ? activeQuery.error.message
                : 'Unknown error'
            }
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void activeQuery.refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Live locations</CardTitle>
                <span className="text-xs text-neutral-500">
                  <IconLocation className="!h-3 !w-3 -mt-0.5 mr-0.5 inline-block" />
                  Lagos
                </span>
              </CardHeader>
              <CardBody>
                <MapPlaceholder
                  pins={pins}
                  googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  className="aspect-[16/6]"
                  onPinClick={(pin) => {
                    router.push(`/jobs/${pin.jobId ?? pin.id}`);
                  }}
                />
              </CardBody>
            </Card>

            {activeQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <DataTable
                data={assignments}
                columns={columns}
                rowKey={(a) => a.sessionId}
                emptyTitle="No workers on the clock"
                emptyDescription="When workers start a job for you, they appear here."
                pagination={{ pageSizeOptions: [10, 25, 50, 100], itemLabel: 'worker' }}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
