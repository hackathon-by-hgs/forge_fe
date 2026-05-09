import { redirect } from 'next/navigation';

export default function WorkersIndexPage() {
  redirect('/workers/active');
}
