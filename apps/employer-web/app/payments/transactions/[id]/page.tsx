'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentTransactionDetailPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/payments/transactions');
  }, [router]);
  return null;
}
