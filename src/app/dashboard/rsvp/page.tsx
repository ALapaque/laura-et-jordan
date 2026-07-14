import { RsvpTable } from '@/components/dashboard/rsvp-table';
import { getMoments, getResponses } from '@/lib/queries';

export default async function RsvpPage() {
  const [responses, moments] = await Promise.all([getResponses(), getMoments()]);
  const momentTitles = Object.fromEntries(moments.map((m) => [m.id, m.title]));
  return <RsvpTable responses={responses} momentTitles={momentTitles} />;
}
