'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/payments/transactions');
  }, [router]);
  return null;
}
