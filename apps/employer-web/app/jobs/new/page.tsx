import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@forge/ui';
import Link from 'next/link';
import { PostJobForm } from './PostJobForm';
import { MOCK_JOBS } from '@forge/mock-data';
import { formatCurrency } from '@forge/ui/utils';

export default function PostAJobPage() {
  const recent = MOCK_JOBS.filter((j) => j.status !== 'draft' && j.status !== 'cancelled').slice(
    0,
    3,
  );

  return (
    <>
      <PageHeader
        title="Post a job"
        description="Reach the right workers in minutes. Templates speed up repeat hires."
        breadcrumbs={[{ label: 'Jobs', href: '/jobs/active' }, { label: 'Post a job' }]}
      />

      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Post like a recent job</CardTitle>
            <Link href="/jobs/history">
              <Button variant="ghost" size="sm">
                View all past jobs
              </Button>
            </Link>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {recent.map((j) => (
                <button
                  key={j.id}
                  type="button"
                  className="rounded-lg border border-neutral-200 bg-white p-3 text-left transition-colors hover:border-accent-300 hover:bg-accent-50/40"
                >
                  <p className="line-clamp-1 text-sm font-medium text-neutral-900">
                    {j.title}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {j.location.neighborhood} ·{' '}
                    <span className="font-medium text-neutral-900 tabular-nums" data-numeric>
                      {formatCurrency(j.payNaira)}
                    </span>
                  </p>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        <PostJobForm />
      </div>
    </>
  );
}
