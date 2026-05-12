'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

<<<<<<< HEAD
/** Search / bookmarks open `/payments/transactions/:id` — land on the list with the drawer. */
export default function PaymentTransactionDetailPage({ params }: { params: { id: string } }) {
  const id = encodeURIComponent(params.id);
  redirect(`/payments/transactions?txn=${id}`);
=======
export default function PaymentTransactionDetailPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/payments/transactions');
  }, [router]);
  return null;
>>>>>>> 3ae1a4ba2a23be8cf8b04bbcaa98daf26581c46f
}
