import { withDbRetry } from '@/db';
import { RsvpTable } from '@/components/dashboard/rsvp-table';
import { getMoments, getParcoursList, getResponses } from '@/lib/queries';

export default async function RsvpPage() {
  const [responses, moments, parcours] = await withDbRetry(() =>
    Promise.all([getResponses(), getMoments(), getParcoursList()]),
  );
  const questionsByParcours = Object.fromEntries(parcours.map((p) => [p.id, p.formQuestions]));
  return (
    <RsvpTable
      responses={responses}
      moments={moments.map((m) => ({ id: m.id, title: m.title }))}
      questionsByParcours={questionsByParcours}
    />
  );
}
