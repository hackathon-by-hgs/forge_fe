import { redirect } from 'next/navigation';

/** Search / bookmarks open `/payments/transactions/:id` — land on the list with the drawer. */
export default function PaymentTransactionDetailPage({ params }: { params: { id: string } }) {
  const id = encodeURIComponent(params.id);
  redirect(`/payments/transactions?txn=${id}`);
}
