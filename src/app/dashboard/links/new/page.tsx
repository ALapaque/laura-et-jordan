import { requireAdmin } from '@/lib/auth';
import { withDbRetry } from '@/db';
import { ParcoursEditor } from '@/components/dashboard/parcours-editor';
import { getMoments } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function NewParcoursPage() {
  await requireAdmin();
  const moments = await withDbRetry(() => getMoments());
  return <ParcoursEditor moments={moments.map((m) => ({ id: m.id, title: m.title }))} />;
}
