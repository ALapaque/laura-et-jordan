'use server';

import { revalidatePath } from 'next/cache';
import { addGalleryPhoto, removeGalleryPhoto, reorderGalleryPhotos } from '@/lib/queries';
import { isStorageConfigured, uploadMedia } from '@/lib/storage';
import type { MomentAsset } from '@/lib/types';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from '@/lib/upload';

function revalidateAll() {
  revalidatePath('/dashboard/gallery');
  revalidatePath('/dashboard');
}

/** Téléverse une photo (bucket public « media ») et l'ajoute à la galerie du couple. */
export async function addGalleryPhotoAction(
  formData: FormData,
): Promise<{ asset?: MomentAsset; error?: string }> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Aucun fichier sélectionné.' };
  if (!file.type.startsWith('image/'))
    return { error: 'Le fichier doit être une image (jpg, png, webp…).' };
  if (file.size > MAX_UPLOAD_BYTES) return { error: `Image trop lourde (max ${MAX_UPLOAD_LABEL}).` };
  if (!isStorageConfigured()) {
    return { error: 'Storage Supabase non configuré — créez le bucket public « media ».' };
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const result = await uploadMedia(
    `gallery/${crypto.randomUUID()}.${ext}`,
    await file.arrayBuffer(),
    file.type,
  );
  if (!result) return { error: 'Échec du téléversement.' };
  try {
    const asset = await addGalleryPhoto({ url: result.url, storagePath: result.path });
    revalidateAll();
    return { asset };
  } catch {
    return { error: 'Galerie non activée — lancez le script 06_gallery.sql dans Supabase.' };
  }
}

export async function removeGalleryPhotoAction(id: string) {
  await removeGalleryPhoto(id);
  revalidateAll();
}

export async function reorderGalleryPhotosAction(orderedIds: string[]) {
  await reorderGalleryPhotos(orderedIds);
  revalidateAll();
}
