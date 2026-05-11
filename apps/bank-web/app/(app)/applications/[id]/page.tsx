import { ApplicationDetailView } from './ApplicationDetailView';

export default function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ApplicationDetailView applicationId={params.id} />;
}
