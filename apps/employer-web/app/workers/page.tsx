'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WorkersIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/workers/active');
  }, [router]);
  return null;
}
