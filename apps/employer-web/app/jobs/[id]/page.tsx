import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  KeyValueList,
  MapPlaceholder,
  PageHeader,
  RadialProgress,
  StatusDot,
  Timeline,
} from '@forge/ui';
import {
  IconBriefcase,
  IconCalendar,
  IconCamera,
  IconCheck,
  IconClock,
  IconLocation,
  IconUser,
} from '@forge/ui/icons';
import {
  formatAbsoluteDate,
  formatCurrency,
  formatDistance,
  formatRelativeTime,
} from '@forge/ui/utils';
import {
  getJobById,
  MOCK_EMPLOYERS,
  MOCK_WORKERS,
} from '@forge/mock-data';
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from '../../../lib/jobUtils';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = getJobById(params.id);
  if (!job) notFound();

  const employer = MOCK_EMPLOYERS.find((e) => e.id === job.employerId);
  const assignedWorker = job.assignedWorkerId
    ? MOCK_WORKERS.find((w) => w.id === job.assignedWorkerId)
    : null;

  // Synthesise a few applications when relevant
  const applicants =
    job.status === 'open' || job.status === 'applications_in'
      ? MOCK_WORKERS.slice(0, Math.min(job.applicationsCount, 6))
      : [];

  const timeline = [
    {
      id: 'posted',
      title: 'Job posted',
      timestamp: formatRelativeTime(job.postedAt),
      tone: 'info' as const,
      icon: <IconBriefcase className="!h-3.5 !w-3.5" />,
    },
    job.applicationsCount > 0
      ? {
          id: 'applied',
          title: `${job.applicationsCount} workers applied`,
          tone: 'info' as const,
          icon: <IconUser className="!h-3.5 !w-3.5" />,
        }
      : null,
    assignedWorker
      ? {
          id: 'accepted',
          title: `Assigned to ${assignedWorker.fullName}`,
          tone: 'warning' as const,
          icon: <IconCheck className="!h-3.5 !w-3.5" />,
        }
      : null,
    job.startedAt
      ? {
          id: 'started',
          title: 'Worker clocked in',
          timestamp: formatRelativeTime(job.startedAt),
          tone: 'warning' as const,
          icon: <IconClock className="!h-3.5 !w-3.5" />,
        }
      : null,
    job.completedAt
      ? {
          id: 'completed',
          title: 'Job completed & verified',
          timestamp: formatRelativeTime(job.completedAt),
          tone: 'success' as const,
          icon: <IconCheck className="!h-3.5 !w-3.5" />,
        }
      : null,
  ].filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <>
      <PageHeader
        title={job.title}
        breadcrumbs={[
          { label: 'Jobs', href: '/jobs/active' },
          { label: job.id },
        ]}
        actions={
          <>
            <Button variant="secondary">Edit</Button>
            {job.status !== 'completed' && job.status !== 'cancelled' ? (
              <Button variant="ghost" className="text-danger-600 hover:bg-danger-50">
                Cancel job
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge tone={JOB_STATUS_TONE[job.status]}>
                  {JOB_STATUS_LABEL[job.status]}
                </Badge>
                <span className="text-xs text-neutral-500" data-numeric>
                  · {job.id}
                </span>
              </div>
              <span
                className="text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {formatCurrency(job.payNaira)}
              </span>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="whitespace-pre-line text-sm text-neutral-700">{job.description}</p>
              <KeyValueList
                layout="grid"
                items={[
                  { label: 'Employer', value: employer?.businessName ?? '—' },
                  { label: 'Job type', value: job.type },
                  { label: 'Duration', value: `${job.durationHours}h` },
                  {
                    label: 'Scheduled start',
                    value: formatAbsoluteDate(job.scheduledStartAt),
                  },
                  { label: 'Location', value: job.location.neighborhood },
                  { label: 'Posted', value: formatRelativeTime(job.postedAt) },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status timeline</CardTitle>
            </CardHeader>
            <CardBody>
              <Timeline items={timeline} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job site</CardTitle>
              <span className="text-xs text-neutral-500">
                <IconLocation className="!h-3 !w-3 -mt-0.5 mr-0.5 inline-block" />
                {job.location.neighborhood}, Lagos
              </span>
            </CardHeader>
            <CardBody>
              <MapPlaceholder
                pins={[{ id: job.id, lat: job.location.lat, lng: job.location.lng, tone: 'accent' }]}
                className="aspect-[16/8]"
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          {assignedWorker ? (
            <Card>
              <CardHeader>
                <CardTitle>Assigned worker</CardTitle>
                <Badge tone="success" variant="soft">
                  <StatusDot tone="success" pulse /> Live
                </Badge>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar name={assignedWorker.fullName} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {assignedWorker.fullName}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {assignedWorker.phone}
                    </p>
                  </div>
                  <RadialProgress
                    value={assignedWorker.reliabilityScore}
                    size={56}
                    strokeWidth={6}
                  />
                </div>
                <KeyValueList
                  items={[
                    { label: 'Jobs completed', value: assignedWorker.jobsCompleted },
                    {
                      label: 'On-time rate',
                      value: `${(assignedWorker.onTimeRate * 100).toFixed(0)}%`,
                    },
                  ]}
                />
                <div className="flex gap-2">
                  <Link href={`/workers/${assignedWorker.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                      View profile
                    </Button>
                  </Link>
                  <Button className="flex-1">Contact</Button>
                </div>
              </CardBody>
            </Card>
          ) : null}

          {applicants.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
                <Badge tone="info">{applicants.length}</Badge>
              </CardHeader>
              <CardBody>
                <ul className="divide-y divide-neutral-100">
                  {applicants.map((w, idx) => (
                    <li key={w.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <Avatar name={w.fullName} size="md" />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/workers/${w.id}`}
                          className="block truncate text-sm font-medium text-neutral-900 hover:underline"
                        >
                          {w.fullName}
                        </Link>
                        <p className="truncate text-xs text-neutral-500">
                          Score {w.reliabilityScore} · {formatDistance(800 + idx * 350)}
                        </p>
                      </div>
                      <Button size="sm">Accept</Button>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}

          {job.status === 'completed' ? (
            <Card>
              <CardHeader>
                <CardTitle>Completion proof</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="flex aspect-square items-center justify-center rounded-md bg-neutral-100 text-neutral-400"
                    >
                      <IconCamera className="!h-6 !w-6" />
                    </div>
                  ))}
                </div>
                <KeyValueList
                  items={[
                    {
                      label: 'Clock in',
                      value: job.startedAt ? formatAbsoluteDate(job.startedAt) : '—',
                    },
                    {
                      label: 'Clock out',
                      value: job.completedAt ? formatAbsoluteDate(job.completedAt) : '—',
                    },
                    { label: 'Total paid', value: formatCurrency(job.payNaira) },
                  ]}
                />
                <Button variant="secondary" className="w-full">
                  Generate invoice
                </Button>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex items-start gap-3 text-sm">
                <IconCalendar className="!h-4 !w-4 text-neutral-400" />
                <div>
                  <p className="font-medium text-neutral-900">
                    {formatAbsoluteDate(job.scheduledStartAt)}
                  </p>
                  <p className="text-xs text-neutral-500">{job.durationHours}h shift</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
