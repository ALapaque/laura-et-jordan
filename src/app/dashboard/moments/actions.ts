'use server';

import { revalidatePath } from 'next/cache';
import {
  createMoment,
  deleteMoment,
  reorderMoments,
  setMomentImage,
  updateMoment,
} from '@/lib/queries';
import { isStorageConfigured, uploadMedia } from '@/lib/storage';
import type { Moment } from '@/lib/types';

function revalidateAll() {
  revalidatePath('/dashboard/moments');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/links');
}

export async function createMomentAction(title: string): Promise<Moment> {
  const moment = await createMoment({ title: title.trim() || 'Nouveau moment' });
  revalidateAll();
  return moment;
}

export async function updateMomentAction(
  id: string,
  patch: {
    title?: string;
    startsAt?: string | null;
    location?: string | null;
    description?: string;
    dressCode?: string | null;
  },
) {
  await updateMoment(id, patch);
  revalidateAll();
}

export async function deleteMomentAction(id: string) {
  await deleteMoment(id);
  revalidateAll();
}

export async function reorderMomentsAction(ids: string[]) {
  await reorderMoments(ids);
  revalidateAll();
}

/** Téléverse une photo (bucket public « media ») et l'associe au moment. */
export async function uploadMomentImageAction(
  momentId: string,
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Aucun fichier sélectionné.' };
  if (!file.type.startsWith('image/'))
    return { error: 'Le fichier doit être une image (jpg, png, webp…).' };
  if (file.size > 8 * 1024 * 1024) return { error: 'Image trop lourde (max 8 Mo).' };
  if (!isStorageConfigured()) {
    return { error: 'Storage Supabase non configuré — créez le bucket public « media ».' };
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const result = await uploadMedia(
    `moments/${momentId}-${Date.now()}.${ext}`,
    await file.arrayBuffer(),
    file.type,
  );
  if (!result) return { error: 'Échec du téléversement.' };
  await setMomentImage(momentId, { url: result.url, storagePath: result.path });
  revalidateAll();
  return { url: result.url };
}

export async function removeMomentImageAction(momentId: string) {
  await setMomentImage(momentId, null);
  revalidateAll();
}
