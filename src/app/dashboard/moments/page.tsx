import { withDbRetry } from '@/db';
import { MomentsEditor } from '@/components/dashboard/moments-editor';
import { getMoments } from '@/lib/queries';

export default async function MomentsPage() {
  const moments = await withDbRetry(() => getMoments());
  return <MomentsEditor initial={moments} />;
}
