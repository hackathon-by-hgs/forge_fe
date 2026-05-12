import { LoanDetailView } from './LoanDetailView';

export default function LoanDetailPage({ params }: { params: { id: string } }) {
  return <LoanDetailView loanId={params.id} />;
}
