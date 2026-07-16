import { notFound } from 'next/navigation';
import { withDbRetry } from '@/db';
import { ParcoursEditor } from '@/components/dashboard/parcours-editor';
import { getMoments, getParcoursList } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EditParcoursPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [parcoursList, moments] = await withDbRetry(() =>
    Promise.all([getParcoursList(), getMoments()]),
  );
  const p = parcoursList.find((x) => x.id === id);
  if (!p) notFound();
  return (
    <ParcoursEditor
      moments={moments.map((m) => ({ id: m.id, title: m.title }))}
      initial={{
        id: p.id,
        name: p.name,
        visibleMomentIds: p.visibleMomentIds,
        formQuestions: p.formQuestions,
        token: p.token,
      }}
    />
  );
}
