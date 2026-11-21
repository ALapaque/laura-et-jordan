import { requireAdmin } from '@/lib/auth';
import { withDbRetry } from '@/db';
import { GalleryEditor } from '@/components/dashboard/gallery-editor';
import { getGalleryPhotos } from '@/lib/queries';

export default async function GalleryPage() {
  await requireAdmin();
  const photos = await withDbRetry(() => getGalleryPhotos());
  return <GalleryEditor initial={photos} />;
}
