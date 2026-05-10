'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardBody, CardHeader, CardTitle } from '@forge/ui';

export default function PaymentTransactionDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Transaction</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 text-sm text-neutral-600">
          <p>
            Detail view for transaction <span className="font-mono text-ink">{id || '—'}</span> is not wired to
            the API in this phase. Use Payments for live data when it ships.
          </p>
          <Link href="/payments/transactions" className="font-medium text-accent-600 hover:text-accent-700">
            Back to transactions
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
