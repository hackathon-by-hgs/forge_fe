'use client';

import Link from 'next/link';
import { Card, CardBody, CardHeader, CardTitle } from '@forge/ui';

export default function OnboardingBusinessPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Finish setting up your business</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4 text-sm text-neutral-600">
          <p>
            Your account is not linked to an employer yet. Complete business registration to get full access to
            the dashboard.
          </p>
          <Link
            href="/signup/business"
            className="inline-flex h-9 items-center justify-center rounded-md bg-accent-500 px-4 text-sm font-medium text-white hover:bg-accent-600"
          >
            Register business
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
