import { WorkSessionDetailView } from './WorkSessionDetailView';

export default function WorkSessionDetailPage({ params }: { params: { id: string } }) {
  return <WorkSessionDetailView sessionId={params.id} />;
}
