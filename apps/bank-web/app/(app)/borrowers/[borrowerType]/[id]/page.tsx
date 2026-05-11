import { notFound } from 'next/navigation';
import { BorrowerProfileView } from './BorrowerProfileView';

export default function BorrowerProfilePage({
  params,
}: {
  params: { borrowerType: string; id: string };
}) {
  const t = params.borrowerType;
  if (t !== 'worker' && t !== 'business') notFound();
  return <BorrowerProfileView borrowerType={t} borrowerId={params.id} />;
}
