'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import {
  addMomentAsset,
  createMoment,
  deleteMoment,
  removeMomentAsset,
  reorderMomentAssets,
  reorderMoments,
  updateMoment,
} from '@/lib/queries';
import { isStorageConfigured, uploadMedia } from '@/lib/storage';
import type { Moment, MomentAsset } from '@/lib/types';
import { imageExtension, MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from '@/lib/upload';

function revalidateAll() {
  revalidatePath('/dashboard/moments');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/links');
}

export async function createMomentAction(title: string): Promise<Moment> {
  await requireAdmin();
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
  await requireAdmin();
  await updateMoment(id, patch);
  revalidateAll();
}

export async function deleteMomentAction(id: string) {
  await requireAdmin();
  await deleteMoment(id);
  revalidateAll();
}

export async function reorderMomentsAction(ids: string[]) {
  await requireAdmin();
  await reorderMoments(ids);
  revalidateAll();
}

// ── Galerie de photos d'un moment ────────────────────────────────
/** Téléverse une photo (bucket public « media ») et l'ajoute à la galerie du moment. */
export async function addMomentPhotoAction(
  momentId: string,
  formData: FormData,
): Promise<{ asset?: MomentAsset; error?: string }> {
  await requireAdmin();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Aucun fichier sélectionné.' };
  const ext = imageExtension(file.type);
  if (!ext) return { error: 'Le fichier doit être une image JPG, PNG ou WebP.' };
  if (file.size > MAX_UPLOAD_BYTES) return { error: `Image trop lourde (max ${MAX_UPLOAD_LABEL}).` };
  if (!isStorageConfigured()) {
    return { error: 'Storage Supabase non configuré — créez le bucket public « media ».' };
  }
  const result = await uploadMedia(
    `moments/${momentId}-${Date.now()}.${ext}`,
    await file.arrayBuffer(),
    file.type,
  );
  if (!result) return { error: 'Échec du téléversement.' };
  try {
    const asset = await addMomentAsset(momentId, { url: result.url, storagePath: result.path });
    revalidateAll();
    return { asset };
  } catch {
    return {
      error: 'Galeries non activées — lancez le script 04_moment_media.sql dans Supabase.',
    };
  }
}

export async function removeMomentPhotoAction(assetId: string) {
  await requireAdmin();
  await removeMomentAsset(assetId);
  revalidateAll();
}

export async function reorderMomentPhotosAction(momentId: string, orderedIds: string[]) {
  await requireAdmin();
  await reorderMomentAssets(momentId, orderedIds);
  revalidateAll();
}
