import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  KeyValueList,
  PageHeader,
  RadialProgress,
} from '@forge/ui';
import { IconAdd, IconBriefcase, IconLocation } from '@forge/ui/icons';
import {
  formatAbsoluteDate,
  formatCurrency,
} from '@forge/ui/utils';
import { getWorkerById, MOCK_JOBS } from '@forge/mock-data';
import { PastJobsList } from './PastJobsList';

const REVIEWS = [
  {
    id: 'r1',
    author: 'Apapa Trade Co.',
    rating: 5,
    body: 'Showed up early, worked efficiently. Will hire again.',
  },
  {
    id: 'r2',
    author: 'Lekki Distribution',
    rating: 5,
    body: 'Reliable and respectful. Great communication on site.',
  },
  {
    id: 'r3',
    author: 'Crown Imports',
    rating: 4,
    body: 'Solid work — would hire again on short notice.',
  },
];

export default function WorkerProfilePage({ params }: { params: { id: string } }) {
  const worker = getWorkerById(params.id);
  if (!worker) notFound();

  const pastJobs = MOCK_JOBS.filter((j) => j.assignedWorkerId === worker.id);

  return (
    <>
      <PageHeader
        title={worker.fullName}
        breadcrumbs={[
          { label: 'Workers', href: '/workers/active' },
          { label: 'Profile' },
        ]}
        actions={
          <>
            <Button variant="ghost" className="text-danger-600 hover:bg-danger-50">
              Block worker
            </Button>
            <Button variant="secondary">Save to team</Button>
            <Link href="/jobs/new">
              <Button leadingIcon={<IconAdd className="!h-4 !w-4" />}>Hire for a job</Button>
            </Link>
          </>
        }
      />

      <div className="space-y-6 p-6">
        <Card>
          <CardBody>
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <Avatar name={worker.fullName} size="lg" className="!h-20 !w-20 !text-base" />
              <div className="flex-1 space-y-1">
                <p className="text-2xl font-semibold text-neutral-900">{worker.fullName}</p>
                <p className="text-sm text-neutral-500">
                  <Badge variant="soft" className="mr-2">
                    {worker.primarySkill}
                  </Badge>
                  Member since {formatAbsoluteDate(worker.joinedAt)}
                </p>
                <p className="inline-flex items-center gap-1 text-xs text-neutral-500">
                  <IconLocation className="!h-3 !w-3" />
                  {worker.homeLocation.neighborhood}, Lagos
                </p>
              </div>
              <RadialProgress value={worker.reliabilityScore} label="Reliability" />
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardBody>
              <p className="text-xs text-neutral-500">Total jobs</p>
              <p
                className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {worker.jobsCompleted}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-neutral-500">Earnings range</p>
              <p
                className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {formatCurrency(worker.totalEarnedNaira, { compact: true })}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-neutral-500">On-time rate</p>
              <p
                className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums"
                data-numeric
              >
                {(worker.onTimeRate * 100).toFixed(0)}%
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-neutral-500">Average rating</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900">★ 4.8</p>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Jobs with us</CardTitle>
              <Badge>{pastJobs.length}</Badge>
            </CardHeader>
            <CardBody>
              {pastJobs.length === 0 ? (
                <EmptyState
                  icon={<IconBriefcase className="!h-5 !w-5" />}
                  title="No prior jobs together"
                  description="Hire this worker for a job and their history with you will appear here."
                  action={
                    <Link href="/jobs/new">
                      <Button>Hire for a job</Button>
                    </Link>
                  }
                />
              ) : (
                <PastJobsList jobs={pastJobs} />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent reviews</CardTitle>
            </CardHeader>
            <CardBody>
              <ul className="space-y-4">
                {REVIEWS.map((r) => (
                  <li key={r.id}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-neutral-900">{r.author}</p>
                      <span className="text-xs text-warning-500">
                        {'★'.repeat(r.rating)}
                        <span className="text-neutral-200">{'★'.repeat(5 - r.rating)}</span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-600">{r.body}</p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reliability snapshot</CardTitle>
          </CardHeader>
          <CardBody>
            <KeyValueList
              layout="grid"
              items={[
                {
                  label: 'Member since',
                  value: formatAbsoluteDate(worker.joinedAt),
                },
                { label: 'Jobs completed', value: worker.jobsCompleted },
                {
                  label: 'On-time arrival',
                  value: `${(worker.onTimeRate * 100).toFixed(0)}%`,
                },
                {
                  label: 'Avg weekly income',
                  value: formatCurrency(worker.averageWeeklyIncomeNaira),
                },
              ]}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
