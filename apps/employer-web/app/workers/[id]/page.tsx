import { WorkerProfileView } from './WorkerProfileView';

export default function WorkerProfilePage({ params }: { params: { id: string } }) {
  return <WorkerProfileView workerId={params.id} />;
}
