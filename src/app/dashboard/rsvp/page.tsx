import { withDbRetry } from '@/db';
import { RsvpTable } from '@/components/dashboard/rsvp-table';
import { getMoments, getResponses } from '@/lib/queries';

export default async function RsvpPage() {
  const [responses, moments] = await withDbRetry(() =>
    Promise.all([getResponses(), getMoments()]),
  );
  return (
    <RsvpTable responses={responses} moments={moments.map((m) => ({ id: m.id, title: m.title }))} />
  );
}
