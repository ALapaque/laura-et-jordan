'use server';

import { revalidatePath } from 'next/cache';
import {
  createDetailCard,
  deleteDetailCard,
  setDetailCardImage,
  updateDetailCard,
  updateWeddingContent,
} from '@/lib/queries';
import { isStorageConfigured, uploadMedia } from '@/lib/storage';
import type { DetailCard } from '@/lib/types';

export async function updateContentAction(input: {
  coupleNames: string;
  eventDate: string | null;
  venue: string | null;
  welcomeText: string;
}) {
  await updateWeddingContent({
    coupleNames: input.coupleNames.trim() || 'Laura & Jordan',
    eventDate: input.eventDate || null,
    venue: input.venue?.trim() || null,
    welcomeText: input.welcomeText,
  });
  revalidatePath('/dashboard/content');
  revalidatePath('/dashboard');
  return { ok: true };
}

// ── Cartes « détails pratiques » ─────────────────────────────────
export async function createDetailCardAction(): Promise<DetailCard> {
  const card = await createDetailCard({ label: 'Nouvelle carte', value: '' });
  revalidatePath('/dashboard/content');
  return card;
}

export async function updateDetailCardAction(
  id: string,
  input: { label?: string; value?: string },
) {
  await updateDetailCard(id, input);
  revalidatePath('/dashboard/content');
}

export async function deleteDetailCardAction(id: string) {
  await deleteDetailCard(id);
  revalidatePath('/dashboard/content');
}

/** Téléverse une image (bucket public « media ») et l'associe à une carte. */
export async function uploadDetailCardImageAction(
  id: string,
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
    `details/${id}-${Date.now()}.${ext}`,
    await file.arrayBuffer(),
    file.type,
  );
  if (!result) return { error: 'Échec du téléversement.' };
  await setDetailCardImage(id, { url: result.url, storagePath: result.path });
  revalidatePath('/dashboard/content');
  return { url: result.url };
}

export async function removeDetailCardImageAction(id: string) {
  await setDetailCardImage(id, null);
  revalidatePath('/dashboard/content');
}
