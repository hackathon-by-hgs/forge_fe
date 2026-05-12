'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  PageHeader,
  Skeleton,
} from '@forge/ui';
import { formatCurrency } from '@forge/ui/utils';
import { listRecentTemplates, type JobTemplate } from '../../../lib/jobsApi';
import { PostJobForm } from './PostJobForm';

export default function PostAJobPage() {
  const templatesQuery = useQuery({
    queryKey: ['employer', 'jobs', 'recent-templates'],
    queryFn: listRecentTemplates,
    retry: false,
  });

  const [appliedTemplate, setAppliedTemplate] = useState<JobTemplate | null>(null);

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
            {templatesQuery.isLoading ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (templatesQuery.data?.data ?? []).length === 0 ? (
              <p className="text-sm text-neutral-500">
                No recent jobs yet. Post a job below and we’ll save it as a template for next
                time.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {templatesQuery.data!.data.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAppliedTemplate(t)}
                    className="rounded-lg border border-outline bg-surface p-3 text-left transition-colors hover:border-accent-300 hover:bg-accent-50/40"
                  >
                    <p className="line-clamp-1 text-sm font-medium text-neutral-900">
                      {t.title}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {t.location.neighborhood ?? t.location.address} ·{' '}
                      <span
                        className="font-medium text-neutral-900 tabular-nums"
                        data-numeric
                      >
                        {formatCurrency(t.payNaira)}
                      </span>
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <PostJobForm template={appliedTemplate} />
      </div>
    </>
  );
}
